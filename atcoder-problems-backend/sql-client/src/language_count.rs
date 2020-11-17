use crate::models::{Submission, UserLanguageCount};
use crate::{PgPool, MAX_INSERT_ROWS};
use anyhow::Result;
use async_trait::async_trait;
use regex::Regex;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};

#[async_trait]
pub trait LanguageCountClient {
    async fn update_language_count(
        &self,
        submissions: &[Submission],
        current_counts: &[UserLanguageCount],
    ) -> Result<()>;
    async fn load_language_count(&self) -> Result<Vec<UserLanguageCount>>;
}

#[async_trait]
impl LanguageCountClient for PgPool {
    async fn update_language_count(
        &self,
        submissions: &[Submission],
        current_counts: &[UserLanguageCount],
    ) -> Result<()> {
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
                    let simplified_language = simplify_language(&language);
                    map.entry((user_id, simplified_language))
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
        let count = sqlx::query(
            r"
            SELECT 
                user_id,
                simplified_language,
                problem_count
            FROM language_count
            ORDER BY user_id
            ",
        )
        .try_map(|row: PgRow| {
            let user_id: String = row.try_get("user_id")?;
            let simplified_language: String = row.try_get("simplified_language")?;
            let problem_count: i32 = row.try_get("problem_count")?;
            Ok(UserLanguageCount {
                user_id,
                simplified_language,
                problem_count,
            })
        })
        .fetch_all(self)
        .await?;
        Ok(count)
    }
}

fn simplify_language(lang: &str) -> String {
    let re = Regex::new(r"\d*\s*\(.*\)").unwrap();
    if lang.starts_with("Perl6") {
        "Perl6".to_string()
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
        assert_eq!(simplify_language("Perl6"), "Perl6");
        assert_eq!(simplify_language("Fortran(GNU Fortran 9.2.1)"), "Fortran");
        assert_eq!(simplify_language("Ada2012 (GNAT 9.2.1)"), "Ada");
        assert_eq!(simplify_language("PyPy2 (7.3.0)"), "PyPy");
        assert_eq!(simplify_language("Haxe (4.0.3); js"), "Haxe; js");
    }
}
