use crate::sql::models::Submission;
use crate::sql::schema::accepted_count;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{insert_into, PgConnection, QueryResult};
use std::collections::{BTreeMap, BTreeSet};

pub trait AcceptedCountUpdater {
    fn update_accepted_count(&self, submissions: &[Submission]) -> QueryResult<usize>;
}

impl AcceptedCountUpdater for PgConnection {
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
