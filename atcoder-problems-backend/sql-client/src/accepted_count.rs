use crate::models::{Submission, UserProblemCount};
use crate::{PgPool, MAX_INSERT_ROWS};
use anyhow::Result;
use async_trait::async_trait;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};

#[async_trait]
pub trait AcceptedCountClient {
    async fn load_accepted_count(&self) -> Result<Vec<UserProblemCount>>;
    async fn get_users_accepted_count(&self, user_id: &str) -> Option<i32>;
    async fn get_accepted_count_rank(&self, accepted_count: i32) -> Result<i64>;
    async fn update_accepted_count(&self, submissions: &[Submission]) -> Result<()>;
}

#[async_trait]
impl AcceptedCountClient for PgPool {
    async fn load_accepted_count(&self) -> Result<Vec<UserProblemCount>> {
        let count = sqlx::query(
            r"
            SELECT user_id, problem_count FROM accepted_count
            ORDER BY problem_count DESC, user_id ASC
            ",
        )
        .try_map(|row: PgRow| {
            let user_id: String = row.try_get("user_id")?;
            let problem_count: i32 = row.try_get("problem_count")?;
            Ok(UserProblemCount {
                user_id,
                problem_count,
            })
        })
        .fetch_all(self)
        .await?;

        Ok(count)
    }

    async fn get_users_accepted_count(&self, user_id: &str) -> Option<i32> {
        let count = sqlx::query(
            r"
            SELECT problem_count FROM accepted_count
            WHERE user_id = $1
            ",
        )
        .bind(user_id)
        .try_map(|row: PgRow| row.try_get::<i32, _>("problem_count"))
        .fetch_one(self)
        .await
        .ok()?;

        Some(count)
    }

    async fn get_accepted_count_rank(&self, accepted_count: i32) -> Result<i64> {
        let rank = sqlx::query(
            r"
            SELECT COUNT(*) AS rank
            FROM accepted_count
            WHERE problem_count > $1
            ",
        )
        .bind(accepted_count)
        .try_map(|row: PgRow| row.try_get::<i64, _>("rank"))
        .fetch_one(self)
        .await?;

        Ok(rank)
    }

    async fn update_accepted_count(&self, submissions: &[Submission]) -> Result<()> {
        let accepted_count = submissions
            .iter()
            .map(|s| (s.user_id.as_str(), s.problem_id.as_str()))
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id)| {
                map.entry(user_id)
                    .or_insert_with(BTreeSet::new)
                    .insert(problem_id);
                map
            })
            .into_iter()
            .map(|(user_id, set)| (user_id, set.len() as i32))
            .collect::<Vec<_>>();

        for chunk in accepted_count.chunks(MAX_INSERT_ROWS) {
            let (user_ids, ac_counts): (Vec<&str>, Vec<i32>) = chunk.iter().copied().unzip();
            sqlx::query(
                r"
                INSERT INTO accepted_count (user_id, problem_count)
                VALUES (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::INTEGER[])
                )
                ON CONFLICT (user_id)
                DO UPDATE SET problem_count = EXCLUDED.problem_count
                ",
            )
            .bind(user_ids)
            .bind(ac_counts)
            .execute(self)
            .await?;
        }

        Ok(())
    }
}
