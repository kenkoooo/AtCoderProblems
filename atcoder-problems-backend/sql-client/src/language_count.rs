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
    async fn update_language_count(&self, submissions: &[Submission]) -> Result<()>;
    async fn load_language_count(&self) -> Result<Vec<UserLanguageCount>>;
}

#[async_trait]
impl LanguageCountClient for PgPool {
    async fn update_language_count(&self, submissions: &[Submission]) -> Result<()> {
        let re = Regex::new(r"\d* \(.*\)").unwrap();
        let language_count = submissions
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
                    let simplified_language = if language.len() >= 5 && &language[..5] == "Perl6" {
                        "Perl6".to_string()
                    } else {
                        re.replace(&language, "").to_string()
                    };
                    map.entry((user_id, simplified_language))
                        .or_insert_with(BTreeSet::new)
                        .insert(problem_id);
                    map
                },
            )
            .into_iter()
            .map(|((user_id, language), set)| (user_id, language, set.len() as i32))
            .collect::<Vec<_>>();

        unzip_n::unzip_n!(3);

        for chunk in language_count.chunks(MAX_INSERT_ROWS) {
            let (user_ids, languages, counts): (Vec<&str>, Vec<String>, Vec<i32>) =
                chunk.iter().cloned().unzip_n_vec();

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
