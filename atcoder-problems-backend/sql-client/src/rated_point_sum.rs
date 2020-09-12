use crate::models::{ContestProblem, Submission};
use crate::{PgPool, FIRST_AGC_EPOCH_SECOND, MAX_INSERT_ROWS, UNRATED_STATE};
use anyhow::Result;
use async_trait::async_trait;
use futures::try_join;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};

#[async_trait]
pub trait RatedPointSumClient {
    async fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()>;
    async fn get_users_rated_point_sum(&self, user_id: &str) -> Option<f64>;
    async fn get_rated_point_sum_rank(&self, point: f64) -> Result<i64>;
}

#[async_trait]
impl RatedPointSumClient for PgPool {
    async fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()> {
        let rated_contest_ids_fut = sqlx::query(
            r"
            SELECT id FROM contests
            WHERE start_epoch_second >= $1
            AND rate_change != $2
            ",
        )
        .bind(FIRST_AGC_EPOCH_SECOND)
        .bind(UNRATED_STATE)
        .try_map(|row: PgRow| row.try_get::<String, _>("id"))
        .fetch_all(self);

        let rated_problem_ids_fut =
            sqlx::query("SELECT contest_id, problem_id FROM contest_problem")
                .try_map(|row: PgRow| {
                    let contest_id: String = row.try_get("contest_id")?;
                    let problem_id: String = row.try_get("problem_id")?;
                    Ok(ContestProblem {
                        contest_id,
                        problem_id,
                    })
                })
                .fetch_all(self);

        let (rated_contest_ids, rated_problem_ids) =
            try_join!(rated_contest_ids_fut, rated_problem_ids_fut)?;

        let rated_contest_ids = rated_contest_ids.into_iter().collect::<BTreeSet<_>>();
        let rated_problem_ids = rated_problem_ids
            .into_iter()
            .filter(|p| rated_contest_ids.contains(&p.contest_id))
            .map(|p| p.problem_id)
            .collect::<BTreeSet<_>>();
        let rated_point_sum = ac_submissions
            .iter()
            .filter(|s| rated_problem_ids.contains(&s.problem_id))
            .map(|s| (s.user_id.as_str(), s.problem_id.as_str(), s.point))
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id, point)| {
                map.entry(user_id)
                    .or_insert_with(BTreeMap::new)
                    .insert(problem_id, point as u32);
                map
            })
            .into_iter()
            .map(|(user_id, set)| {
                let sum = set.into_iter().map(|(_, point)| point).sum::<u32>();
                (user_id, sum)
            })
            .collect::<Vec<_>>();

        for chunk in rated_point_sum.chunks(MAX_INSERT_ROWS) {
            let (user_ids, point_sums): (Vec<&str>, Vec<u32>) = chunk.iter().copied().unzip();
            sqlx::query(
                r"
                INSERT INTO rated_point_sum (user_id, point_sum)
                VALUE (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::FLOAT8[]))
                )
                ON CONFLICT (user_id)
                DO UPDATE SET point_sum = EXCLUDED.point_sum
                ",
            )
            .bind(user_ids)
            .bind(point_sums)
            .execute(self)
            .await?;
        }
        Ok(())
    }

    async fn get_users_rated_point_sum(&self, user_id: &str) -> Option<f64> {
        let sum = sqlx::query("SELECT point_sum FROM rated_point_sum WHERE user_id = $1")
            .bind(user_id)
            .try_map(|row: PgRow| row.try_get::<f64, _>("point_sum"))
            .fetch_one(self)
            .await
            .ok()?;
        Some(sum)
    }

    async fn get_rated_point_sum_rank(&self, rated_point_sum: f64) -> Result<i64> {
        let rank = sqlx::query("SELECT COUNT(*) AS rank FROM rated_point_sum WHERE point_sum > $1")
            .bind(rated_point_sum)
            .try_map(|row: PgRow| row.try_get::<i64, _>("rank"))
            .fetch_one(self)
            .await?;
        Ok(rank)
    }
}
