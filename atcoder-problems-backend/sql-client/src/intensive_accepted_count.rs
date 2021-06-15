use crate::models::{Submission, UserProblemCount};
use crate::{PgPool, MAX_INSERT_ROWS};

use anyhow::Result;
use async_trait::async_trait;
use chrono::{TimeZone, Utc};
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::BTreeMap;
use std::ops::Range;

#[async_trait]
pub trait IntensiveAcceptedCountClient {
    async fn load_intensive_accepted_count_in_range(
        &self,
        rank_range: Range<usize>,
    ) -> Result<Vec<UserProblemCount>>;
    async fn get_users_intensive_accepted_count(&self, user_id: &str) -> Option<i32>;
    async fn get_intensive_accepted_count_rank(&self, intensive_accepted_count: i32) -> Result<i64>;
    async fn update_intensive_accepted_count(&self, submissions: &[Submission]) -> Result<()>;
}

#[async_trait]
impl IntensiveAcceptedCountClient for PgPool {
    async fn load_intensive_accepted_count_in_range(
        &self,
        rank_range: Range<usize>,
    ) -> Result<Vec<UserProblemCount>> {
        let count = sqlx::query(
            r"
            SELECT user_id, problem_count FROM intensive_accepted_count
            ORDER BY problem_count DESC, user_id ASC
            OFFSET $1 LIMIT $2;
            ",
        )
        .bind(rank_range.start as i32)
        .bind(rank_range.len() as i32)
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

    async fn get_users_intensive_accepted_count(&self, user_id: &str) -> Option<i32> {
        let count = sqlx::query(
            r"
            SELECT problem_count FROM intensive_accepted_count
            WHERE LOWER(user_id) = LOWER($1)
            ",
        )
        .bind(user_id)
        .try_map(|row: PgRow| row.try_get::<i32, _>("problem_count"))
        .fetch_one(self)
        .await
        .ok()?;

        Some(count)
    }

    async fn get_intensive_accepted_count_rank(&self, intensive_accepted_count: i32) -> Result<i64> {
        let rank = sqlx::query(
            r"
            SELECT COUNT(*) AS rank
            FROM intensive_accepted_count
            WHERE problem_count > $1
            ",
        )
        .bind(intensive_accepted_count)
        .try_map(|row: PgRow| row.try_get::<i64, _>("rank"))
        .fetch_one(self)
        .await?;

        Ok(rank)
    }

    async fn update_intensive_accepted_count(&self, recent_ac_submissions: &[Submission]) -> Result<()>
    {
        let mut submissions = recent_ac_submissions
            .iter()
            .map(|s| {
                (
                    Utc.timestamp(s.epoch_second, 0),
                    s.user_id.as_str(),
                    s.problem_id.as_str(),
                )
            })
            .collect::<Vec<_>>();
        submissions.sort_by_key(|&(timestamp, _, _)| timestamp);
        let first_ac_map = submissions.into_iter().fold(
            BTreeMap::new(),
            |mut map, (epoch_second, user_id, problem_id)| {
                map.entry(user_id)
                    .or_insert_with(BTreeMap::new)
                    .entry(problem_id)
                    .or_insert(epoch_second);
                map
            },
        );

        let user_intensive_accepted_count = first_ac_map
            .into_iter()
            .map(|(user_id, m)| {
                let intensive_accepted_count = m.len() as i32;
                (user_id, intensive_accepted_count)
            })
            .collect::<Vec<_>>();

        for chunk in user_intensive_accepted_count.chunks(MAX_INSERT_ROWS) {
            let (user_ids, intensive_accepted_counts): (Vec<&str>, Vec<i32>) = chunk.iter().copied().unzip();
            sqlx::query(
                r"
                INSERT INTO intensive_accepted_count (user_id, problem_count)
                VALUES (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::INTEGER[])
                )
                ON CONFLICT (user_id)
                DO UPDATE SET problem_count = EXCLUDED.problem_count
                ",
            )
            .bind(user_ids)
            .bind(intensive_accepted_counts)
            .execute(self)
            .await?;
        }
        Ok(())
    }
}