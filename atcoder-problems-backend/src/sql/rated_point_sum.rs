use super::models::Submission;
use super::schema::{contests, rated_point_sum};
use super::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use std::collections::{BTreeMap, BTreeSet};

pub trait RatedPointSumUpdater {
    fn update_rated_point_sum(&self, submissions: &[Submission]) -> QueryResult<usize>;
}

impl RatedPointSumUpdater for PgConnection {
    fn update_rated_point_sum(&self, submissions: &[Submission]) -> QueryResult<usize> {
        let rated_contest_ids = contests::table
            .filter(contests::start_epoch_second.gt(FIRST_AGC_EPOCH_SECOND))
            .filter(contests::rate_change.ne(UNRATED_STATE))
            .select(contests::id)
            .load::<String>(self)?
            .into_iter()
            .collect::<BTreeSet<_>>();

        let rated_point_sum = submissions
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
        insert_into(rated_point_sum::table)
            .values(rated_point_sum)
            .on_conflict(rated_point_sum::user_id)
            .do_update()
            .set(rated_point_sum::point_sum.eq(excluded(rated_point_sum::point_sum)))
            .execute(self)
    }
}
