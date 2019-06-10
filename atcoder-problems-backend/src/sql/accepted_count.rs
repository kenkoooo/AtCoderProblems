use crate::sql::models::{Submission, UserProblemCount};
use crate::sql::schema::accepted_count;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{insert_into, PgConnection, QueryResult};
use std::collections::{BTreeMap, BTreeSet};

pub trait AcceptedCountClient {
    fn load_accepted_count(&self) -> QueryResult<Vec<UserProblemCount>>;
    fn get_users_accepted_count(&self, user_id: &str) -> QueryResult<i32>;
    fn get_accepted_count_rank(&self, accepted_count: i32) -> QueryResult<i64>;
    fn update_accepted_count(&self, submissions: &[Submission]) -> QueryResult<usize>;
}

impl AcceptedCountClient for PgConnection {
    fn load_accepted_count(&self) -> QueryResult<Vec<UserProblemCount>> {
        accepted_count::table
            .order_by(accepted_count::problem_count.desc())
            .then_order_by(accepted_count::user_id.asc())
            .load::<UserProblemCount>(self)
    }

    fn get_users_accepted_count(&self, user_id: &str) -> QueryResult<i32> {
        accepted_count::table
            .filter(accepted_count::user_id.eq(user_id))
            .select(accepted_count::problem_count)
            .first::<i32>(self)
    }

    fn get_accepted_count_rank(&self, accepted_count: i32) -> QueryResult<i64> {
        accepted_count::table
            .filter(accepted_count::problem_count.gt(accepted_count))
            .select(count_star())
            .first::<i64>(self)
    }

    fn update_accepted_count(&self, submissions: &[Submission]) -> QueryResult<usize> {
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
        insert_into(accepted_count::table)
            .values(accepted_count)
            .on_conflict(accepted_count::user_id)
            .do_update()
            .set(accepted_count::problem_count.eq(excluded(accepted_count::problem_count)))
            .execute(self)
    }
}
