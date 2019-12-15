use crate::error::Result;
use crate::sql::schema::*;

use diesel::prelude::*;
use diesel::{delete, insert_into, select, update, PgConnection};
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Serialize)]
pub(crate) struct VirtualContest {
    id: String,
    title: String,
    memo: String,
    owner_user_id: String,
    start_epoch_second: i64,
    duration_second: i64,
    problems: Vec<String>,
    participants: Vec<String>,
}

pub(crate) trait VirtualContestManager {
    fn create_contest(
        &self,
        title: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<String>;
    fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
    fn get_participated_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
}

impl VirtualContestManager for PgConnection {
    fn create_contest(
        &self,
        title: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<String> {
        unimplemented!()
    }
    fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>> {
        use internal_virtual_contest_items as v_items;
        use internal_virtual_contest_participants as v_participants;
        use internal_virtual_contests as v_contests;
        let data = v_contests::table
            .left_join(v_items::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)))
            .left_join(
                v_participants::table
                    .on(v_participants::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .filter(v_contests::internal_user_id.eq(internal_user_id))
            .select((
                v_contests::id,
                v_contests::title,
                v_contests::memo,
                v_contests::internal_user_id,
                v_contests::start_epoch_second,
                v_contests::duration_second,
                v_items::problem_id.nullable(),
                v_participants::internal_user_id.nullable(),
            ))
            .load::<(
                String,
                String,
                String,
                String,
                i64,
                i64,
                Option<String>,
                Option<String>,
            )>(self)?;

        let mut contest_set = BTreeSet::new();
        let mut problem_map = BTreeMap::new();
        let mut participants = BTreeMap::new();
        for (id, title, memo, owner, start, duration, problem_id, user_id) in data.into_iter() {
            contest_set.insert((id.clone(), title, memo, owner, start, duration));
            if let Some(problem_id) = problem_id {
                problem_map
                    .entry(id.clone())
                    .or_insert(BTreeSet::new())
                    .insert(problem_id);
            }
            if let Some(user_id) = user_id {
                participants
                    .entry(id)
                    .or_insert(BTreeSet::new())
                    .insert(user_id);
            }
        }

        let virtual_contests = contest_set
            .into_iter()
            .map(
                |(id, title, memo, owner_user_id, start_epoch_second, duration_second)| {
                    let problems = problem_map
                        .get(&id)
                        .map(|set| set.iter().cloned().collect::<Vec<_>>())
                        .unwrap_or_else(Vec::new);
                    let participants = participants
                        .get(&id)
                        .map(|set| set.iter().cloned().collect::<Vec<_>>())
                        .unwrap_or_else(Vec::new);
                    VirtualContest {
                        id,
                        title,
                        memo,
                        owner_user_id,
                        start_epoch_second,
                        duration_second,
                        problems,
                        participants,
                    }
                },
            )
            .collect::<Vec<_>>();
        Ok(virtual_contests)
    }
    fn get_participated_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>> {
        unimplemented!()
    }
}
