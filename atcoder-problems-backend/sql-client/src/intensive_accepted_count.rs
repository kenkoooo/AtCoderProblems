use crate::models::{Submission, UserProblemCount};
use crate::{PgPool, MAX_INSERT_ROWS};
use anyhow::Result;
use async_trait::async_trait;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};
use std::ops::Range;

#[async_trait]
pub trait IntensiveAcceptedCountClient {
    async fn load_intensive_accepted_count(&self) -> Result<Vec<UserProblemCount>>;
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
    async fn load_intensive_accepted_count(&self) -> Result<Vec<UserProblemCount>> {
        let count = sqlx::query(
            r"
            SELECT user_id, problem_count FROM intensive_accepted_count
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

    async fn update_intensive_accepted_count(&self, submissions: &[Submission]) -> Result<()> {
        // copy from StreakClient
        unimplemented!()
    }
}

fn get_max_streak<Tz: TimeZone>(mut v: Vec<DateTime<Tz>>) -> i64 {
    v.sort();
    let (_, max_streak) = (1..v.len()).fold((1, 1), |(current_streak, max_streak), i| {
        if v[i - 1].is_same_day_in_jst(&v[i]) {
            (current_streak, max_streak)
        } else if (v[i - 1].clone() + Duration::days(1)).is_same_day_in_jst(&v[i]) {
            (current_streak + 1, cmp::max(max_streak, current_streak + 1))
        } else {
            (1, max_streak)
        }
    });
    max_streak
}