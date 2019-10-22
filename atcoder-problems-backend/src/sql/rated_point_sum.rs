use super::models::Submission;
use super::schema::{contests, rated_point_sum};
use super::MAX_INSERT_ROWS;
use super::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};
use crate::error::Result;
use crate::utils::SplitToSegments;

use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::PgConnection;
use std::collections::{BTreeMap, BTreeSet};

pub trait RatedPointSumClient {
    fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()>;
    fn get_users_rated_point_sum(&self, user_id: &str) -> Result<f64>;
    fn get_rated_point_sum_rank(&self, point: f64) -> Result<i64>;
}

impl RatedPointSumClient for PgConnection {
    fn update_rated_point_sum(&self, ac_submissions: &[Submission]) -> Result<()> {
        let rated_contest_ids = contests::table
            .filter(contests::start_epoch_second.ge(FIRST_AGC_EPOCH_SECOND))
            .filter(contests::rate_change.ne(UNRATED_STATE))
            .select(contests::id)
            .load::<String>(self)?
            .into_iter()
            .collect::<BTreeSet<_>>();

        let rated_point_sum = ac_submissions
            .iter()
            .filter(|s| rated_contest_ids.contains(&s.contest_id))
            .map(|s| (s.user_id.as_str(), s.problem_id.as_str(), s.point))
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id, point)| {
                map.entry(user_id)
                    .or_insert_with(BTreeSet::new)
                    .insert((problem_id, point as u32));
                map
            })
            .into_iter()
            .map(|(user_id, set)| {
                let sum = set.into_iter().map(|(_, point)| point).sum::<u32>();
                (
                    rated_point_sum::user_id.eq(user_id),
                    rated_point_sum::point_sum.eq(f64::from(sum)),
                )
            })
            .collect::<Vec<_>>();

        for segment in rated_point_sum
            .split_into_segments(MAX_INSERT_ROWS)
            .into_iter()
        {
            insert_into(rated_point_sum::table)
                .values(segment)
                .on_conflict(rated_point_sum::user_id)
                .do_update()
                .set(rated_point_sum::point_sum.eq(excluded(rated_point_sum::point_sum)))
                .execute(self)?;
        }
        Ok(())
    }

    fn get_users_rated_point_sum(&self, user_id: &str) -> Result<f64> {
        let sum = rated_point_sum::table
            .filter(rated_point_sum::user_id.eq(user_id))
            .select(rated_point_sum::point_sum)
            .first::<f64>(self)?;
        Ok(sum)
    }

    fn get_rated_point_sum_rank(&self, rated_point_sum: f64) -> Result<i64> {
        let rank = rated_point_sum::table
            .filter(rated_point_sum::point_sum.gt(rated_point_sum))
            .select(count_star())
            .first::<i64>(self)?;
        Ok(rank)
    }
}
