use super::MAX_INSERT_ROWS;
use crate::error::Result;
use crate::sql::models::{Submission, UserProblemCount};
use crate::sql::schema::accepted_count;
use crate::utils::SplitToSegments;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{insert_into, PgConnection};
use std::collections::{BTreeMap, BTreeSet};

pub trait AcceptedCountClient {
    fn load_accepted_count(&self) -> Result<Vec<UserProblemCount>>;
    fn get_users_accepted_count(&self, user_id: &str) -> Option<i32>;
    fn get_accepted_count_rank(&self, accepted_count: i32) -> Result<i64>;
    fn update_accepted_count(&self, submissions: &[Submission]) -> Result<()>;
}

impl AcceptedCountClient for PgConnection {
    fn load_accepted_count(&self) -> Result<Vec<UserProblemCount>> {
        let count = accepted_count::table
            .order_by(accepted_count::problem_count.desc())
            .then_order_by(accepted_count::user_id.asc())
            .load::<UserProblemCount>(self)?;
        Ok(count)
    }

    fn get_users_accepted_count(&self, user_id: &str) -> Option<i32> {
        let count = accepted_count::table
            .filter(accepted_count::user_id.eq(user_id))
            .select(accepted_count::problem_count)
            .first::<i32>(self)
            .ok()?;
        Some(count)
    }

    fn get_accepted_count_rank(&self, accepted_count: i32) -> Result<i64> {
        let rank = accepted_count::table
            .filter(accepted_count::problem_count.gt(accepted_count))
            .select(count_star())
            .first::<i64>(self)?;
        Ok(rank)
    }

    fn update_accepted_count(&self, submissions: &[Submission]) -> Result<()> {
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
            .map(|(user_id, set)| {
                (
                    accepted_count::user_id.eq(user_id),
                    accepted_count::problem_count.eq(set.len() as i32),
                )
            })
            .collect::<Vec<_>>();

        for segment in accepted_count
            .split_into_segments(MAX_INSERT_ROWS)
            .into_iter()
        {
            insert_into(accepted_count::table)
                .values(segment)
                .on_conflict(accepted_count::user_id)
                .do_update()
                .set(accepted_count::problem_count.eq(excluded(accepted_count::problem_count)))
                .execute(self)?;
        }
        Ok(())
    }
}
