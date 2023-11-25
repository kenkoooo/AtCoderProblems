use crate::models::{ContestProblem, Submission, UserSum};
use crate::{PgPool, FIRST_AGC_EPOCH_SECOND, MAX_INSERT_ROWS, UNRATED_STATE};
use anyhow::Result;
use async_trait::async_trait;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::{BTreeMap, BTreeSet};
use std::ops::Range;

#[async_trait]
pub trait RatedPointSumClient {
    async fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()>;
    async fn get_users_rated_point_sum(&self, user_id: &str) -> Option<i64>;
    async fn get_rated_point_sum_rank(&self, point: i64) -> Result<i64>;
    async fn load_rated_point_sum_in_range(&self, rank_range: Range<usize>)
        -> Result<Vec<UserSum>>;
}

#[async_trait]
impl RatedPointSumClient for PgPool {
    async fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()> {
        let rated_contest_ids_fut = sqlx::query(
            r"
            SELECT contests.id FROM
            (
                SELECT COUNT(*) AS problem_count, contest_id
                FROM contest_problem
                GROUP BY contest_id
            ) AS contest_problem_count
            JOIN contests ON contests.id=contest_problem_count.contest_id
            WHERE
                contests.start_epoch_second >= $1
                AND contests.rate_change != $2
                AND contest_problem_count.problem_count >= 3
            ",
        )
        .bind(FIRST_AGC_EPOCH_SECOND)
        .bind(UNRATED_STATE)
        .try_map(|row: PgRow| row.try_get::<String, _>("id"))
        .fetch_all(self);

        let rated_problem_ids_fut = sqlx::query_as::<_, ContestProblem>(
            "SELECT contest_id, problem_id, problem_index FROM contest_problem",
        )
        .fetch_all(self);

        let (rated_contest_ids, rated_problem_ids) =
            tokio::try_join!(rated_contest_ids_fut, rated_problem_ids_fut)?;

        let rated_contest_ids = BTreeSet::from_iter(rated_contest_ids);
        let rated_problem_ids = rated_problem_ids
            .into_iter()
            .filter(|p| rated_contest_ids.contains(&p.contest_id))
            .map(|p| p.problem_id)
            .collect::<BTreeSet<_>>();
        let rated_point_sum = ac_submissions
            .iter()
            .filter(|s| rated_problem_ids.contains(&s.problem_id))
            .map(|s| {
                if s.point.fract() == 0. {
                    Ok((s.user_id.as_str(), s.problem_id.as_str(), s.point as i64))
                } else {
                    Err(anyhow::anyhow!(
                        "Problem of {} is {}, which is a rated problem, but has non-integer point",
                        s.id,
                        s.problem_id
                    ))
                }
            })
            .collect::<Result<Vec<_>>>()?
            .into_iter()
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id, point)| {
                map.entry(user_id)
                    .or_insert_with(BTreeMap::new)
                    .insert(problem_id, point);
                map
            })
            .into_iter()
            .map(|(user_id, set)| {
                let sum = set.into_values().sum::<i64>();
                (user_id, sum)
            })
            .collect::<Vec<_>>();

        for chunk in rated_point_sum.chunks(MAX_INSERT_ROWS) {
            let (user_ids, point_sums): (Vec<&str>, Vec<i64>) = chunk.iter().copied().unzip();
            sqlx::query(
                r"
                INSERT INTO rated_point_sum (user_id, point_sum)
                VALUES (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::BIGINT[])
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

    async fn get_users_rated_point_sum(&self, user_id: &str) -> Option<i64> {
        let sum = sqlx::query(
            r"
            SELECT point_sum FROM rated_point_sum
            WHERE LOWER(user_id) = LOWER($1)
            ",
        )
        .bind(user_id)
        .try_map(|row: PgRow| row.try_get::<i64, _>("point_sum"))
        .fetch_one(self)
        .await
        .ok()?;
        Some(sum)
    }

    async fn get_rated_point_sum_rank(&self, rated_point_sum: i64) -> Result<i64> {
        let rank = sqlx::query("SELECT COUNT(*) AS rank FROM rated_point_sum WHERE point_sum > $1")
            .bind(rated_point_sum)
            .try_map(|row: PgRow| row.try_get::<i64, _>("rank"))
            .fetch_one(self)
            .await?;
        Ok(rank)
    }

    async fn load_rated_point_sum_in_range(
        &self,
        rank_range: Range<usize>,
    ) -> Result<Vec<UserSum>> {
        let list = sqlx::query_as(
            r"
            SELECT * FROM rated_point_sum
            ORDER BY point_sum DESC, user_id
            OFFSET $1 LIMIT $2;
        ",
        )
        .bind(rank_range.start as i64)
        .bind(rank_range.len() as i64)
        .fetch_all(self)
        .await?;
        Ok(list)
    }
}
