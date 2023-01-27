use crate::models::{Submission, UserLanguageCount, UserLanguageCountRank, UserProblemCount};
use crate::{PgPool, MAX_INSERT_ROWS};
use anyhow::Result;
use async_trait::async_trait;
use regex::Regex;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};
use std::ops::Range;

#[async_trait]
pub trait LanguageCountClient {
    async fn update_language_count(
        &self,
        submissions: &[Submission],
        current_counts: &[UserLanguageCount],
    ) -> Result<()>;
    async fn load_language_count(&self) -> Result<Vec<UserLanguageCount>>;
    async fn load_language_count_in_range(
        &self,
        simplified_language: &str,
        rank_range: Range<usize>,
    ) -> Result<Vec<UserProblemCount>>;
    async fn load_users_language_count(&self, user_id: &str) -> Result<Vec<UserLanguageCount>>;
    async fn load_users_language_count_rank(
        &self,
        user_id: &str,
    ) -> Result<Vec<UserLanguageCountRank>>;
    async fn load_languages(&self) -> Result<Vec<String>>;
}

#[async_trait]
impl LanguageCountClient for PgPool {
    async fn update_language_count(
        &self,
        submissions: &[Submission],
        current_counts: &[UserLanguageCount],
    ) -> Result<()> {
        let mut simplified_languages = BTreeMap::new();
        let mut language_count = submissions
            .iter()
            .map(|s| {
                (
                    s.user_id.as_str(),
                    s.problem_id.as_str(),
                    s.language.as_str(),
                )
            })
            .fold(
                BTreeMap::new(),
                |mut map, (user_id, problem_id, language)| {
                    let simplified_language = simplified_languages
                        .entry(language)
                        .or_insert_with(|| simplify_language(language));
                    map.entry((user_id, simplified_language.to_string()))
                        .or_insert_with(BTreeSet::new)
                        .insert(problem_id);
                    map
                },
            )
            .into_iter()
            .map(|((user_id, language), set)| ((user_id, language), set.len() as i32))
            .collect::<BTreeMap<_, _>>();

        for old_count in current_counts {
            let key = &(
                old_count.user_id.as_str(),
                old_count.simplified_language.clone(),
            );
            if let Some(&new_count) = language_count.get(key) {
                if new_count == old_count.problem_count {
                    assert_eq!(language_count.remove(key), Some(new_count));
                }
            }
        }

        let language_count = language_count
            .into_iter()
            .map(|((user_id, language), count)| (user_id, language, count))
            .collect::<Vec<_>>();
        for chunk in language_count.chunks(MAX_INSERT_ROWS) {
            let (user_ids, languages, counts) = chunk.iter().fold(
                (vec![], vec![], vec![]),
                |(mut user_ids, mut languages, mut counts), cur| {
                    user_ids.push(cur.0);
                    languages.push(cur.1.as_str());
                    counts.push(cur.2);
                    (user_ids, languages, counts)
                },
            );

            sqlx::query(
                r"
                INSERT INTO language_count (user_id, simplified_language, problem_count)
                VALUES (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::VARCHAR(255)[]),
                    UNNEST($3::INTEGER[])
                )
                ON CONFLICT (user_id, simplified_language)
                DO UPDATE SET problem_count = EXCLUDED.problem_count
                ",
            )
            .bind(user_ids)
            .bind(languages)
            .bind(counts)
            .execute(self)
            .await?;
        }
        Ok(())
    }

    async fn load_language_count(&self) -> Result<Vec<UserLanguageCount>> {
        let count = sqlx::query_as(
            r"
            SELECT
                user_id,
                simplified_language,
                problem_count
            FROM language_count
            ORDER BY user_id
            ",
        )
        .fetch_all(self)
        .await?;
        Ok(count)
    }

    async fn load_language_count_in_range(
        &self,
        simplified_language: &str,
        rank_range: Range<usize>,
    ) -> Result<Vec<UserProblemCount>> {
        let list = sqlx::query_as(
            r"
            SELECT user_id, problem_count FROM language_count WHERE simplified_language = $1
            ORDER BY problem_count DESC, user_id ASC
            OFFSET $2 LIMIT $3;
            ",
        )
        .bind(simplified_language)
        .bind(rank_range.start as i32)
        .bind(rank_range.len() as i32)
        .fetch_all(self)
        .await?;
        Ok(list)
    }

    async fn load_users_language_count(&self, user_id: &str) -> Result<Vec<UserLanguageCount>> {
        let count = sqlx::query_as(
            r"
            SELECT user_id, simplified_language, problem_count FROM language_count
            WHERE LOWER(user_id) = LOWER($1)
            ORDER BY simplified_language
            ",
        )
        .bind(user_id)
        .fetch_all(self)
        .await?;
        Ok(count)
    }

    async fn load_users_language_count_rank(
        &self,
        user_id: &str,
    ) -> Result<Vec<UserLanguageCountRank>> {
        let rank = sqlx::query_as(
            r"
            SELECT user_id, simplified_language, rank FROM (
            SELECT *, RANK()
                OVER(PARTITION BY simplified_language ORDER BY problem_count DESC) AS rank
                FROM language_count
            )
            AS s2 WHERE LOWER(user_id) = LOWER($1)
            ORDER BY simplified_language
            ",
        )
        .bind(user_id)
        .fetch_all(self)
        .await?;
        Ok(rank)
    }

    async fn load_languages(&self) -> Result<Vec<String>> {
        let languages = sqlx::query(
            r"SELECT DISTINCT simplified_language FROM language_count ORDER BY simplified_language",
        )
        .try_map(|row: PgRow| row.try_get::<String, _>("simplified_language"))
        .fetch_all(self)
        .await?;
        Ok(languages)
    }
}

fn simplify_language(lang: &str) -> String {
    let re = Regex::new(r"\d*\s*\(.*\)").unwrap();
    if lang.starts_with("Perl6") {
        "Raku".to_string()
    } else {
        re.replace(lang, "").to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simplify_language() {
        assert_eq!(simplify_language("language1"), "language1");
        assert_eq!(simplify_language("Perl (5)"), "Perl");
        assert_eq!(simplify_language("Perl6"), "Raku");
        assert_eq!(simplify_language("Fortran(GNU Fortran 9.2.1)"), "Fortran");
        assert_eq!(simplify_language("Ada2012 (GNAT 9.2.1)"), "Ada");
        assert_eq!(simplify_language("PyPy2 (7.3.0)"), "PyPy");
        assert_eq!(simplify_language("Haxe (4.0.3); js"), "Haxe; js");
    }
}
