use crate::error::{Error, Result};
use crate::sql::schema::*;

use internal_users as i_users;
use internal_virtual_contest_items as v_items;
use internal_virtual_contest_participants as v_participants;
use internal_virtual_contests as v_contests;

use diesel::expression::dsl::count_star;
use diesel::prelude::*;
use diesel::{delete, insert_into, update, PgConnection};
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use uuid::Uuid;

const MAX_CONTEST_NUM: i64 = 1024;
const MAX_PROBLEM_NUM_PER_CONTEST: usize = 16;
const RECENT_CONTEST_NUM: i64 = 500;

type VirtualContestTuple = (
    String,
    String,
    String,
    String,
    i64,
    i64,
    Option<String>,
    Option<String>,
);

#[derive(Serialize)]
pub struct VirtualContest {
    id: String,
    title: String,
    memo: String,
    owner_user_id: String,
    start_epoch_second: i64,
    duration_second: i64,
    pub(crate) problems: Vec<String>,
    participants: Vec<String>,
}

pub trait VirtualContestManager {
    fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<String>;
    fn update_contest(
        &self,
        id: &str,
        title: &str,
        memo: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<()>;

    fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
    fn get_participated_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
    fn get_recent_contests(&self) -> Result<Vec<VirtualContest>>;
    fn get_single_contest(&self, contest_id: &str) -> Result<VirtualContest>;

    fn update_items(&self, contest_id: &str, problem_ids: &[String], user_id: &str) -> Result<()>;

    fn join_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()>;
}

impl VirtualContestManager for PgConnection {
    fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<String> {
        let count = v_contests::table
            .filter(v_contests::internal_user_id.eq(internal_user_id))
            .select(count_star())
            .first::<i64>(self)?;
        if count >= MAX_CONTEST_NUM {
            return Err(Error::InvalidPostRequest);
        }

        let uuid = Uuid::new_v4().to_string();
        insert_into(v_contests::table)
            .values(vec![(
                v_contests::id.eq(&uuid),
                v_contests::title.eq(title),
                v_contests::memo.eq(memo),
                v_contests::internal_user_id.eq(internal_user_id),
                v_contests::start_epoch_second.eq(start_epoch_second),
                v_contests::duration_second.eq(duration_second),
            )])
            .execute(self)?;
        Ok(uuid)
    }
    fn update_contest(
        &self,
        id: &str,
        title: &str,
        memo: &str,
        start_epoch_second: i64,
        duration_second: i64,
    ) -> Result<()> {
        update(v_contests::table.filter(v_contests::id.eq(id)))
            .set((
                v_contests::title.eq(title),
                v_contests::memo.eq(memo),
                v_contests::start_epoch_second.eq(start_epoch_second),
                v_contests::duration_second.eq(duration_second),
            ))
            .execute(self)?;
        Ok(())
    }
    fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>> {
        let data = v_contests::table
            .left_join(v_items::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)))
            .left_join(
                v_participants::table
                    .on(v_participants::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .left_join(
                i_users::table.on(v_participants::internal_user_id.eq(i_users::internal_user_id)),
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
                i_users::atcoder_user_id.nullable(),
            ))
            .load::<VirtualContestTuple>(self)?;

        let virtual_contests = construct_virtual_contests(data);
        Ok(virtual_contests)
    }
    fn get_participated_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>> {
        let participated_contest_ids = v_participants::table
            .filter(v_participants::internal_user_id.eq(internal_user_id))
            .select(v_participants::internal_virtual_contest_id)
            .load::<String>(self)?;

        let data = v_contests::table
            .left_join(v_items::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)))
            .left_join(
                v_participants::table
                    .on(v_participants::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .left_join(
                i_users::table.on(v_participants::internal_user_id.eq(i_users::internal_user_id)),
            )
            .filter(v_contests::id.eq_any(participated_contest_ids))
            .select((
                v_contests::id,
                v_contests::title,
                v_contests::memo,
                v_contests::internal_user_id,
                v_contests::start_epoch_second,
                v_contests::duration_second,
                v_items::problem_id.nullable(),
                i_users::atcoder_user_id.nullable(),
            ))
            .load::<VirtualContestTuple>(self)?;
        let virtual_contests = construct_virtual_contests(data);
        Ok(virtual_contests)
    }

    fn get_recent_contests(&self) -> Result<Vec<VirtualContest>> {
        let data = v_contests::table
            .left_join(v_items::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)))
            .left_join(
                v_participants::table
                    .on(v_participants::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .left_join(
                i_users::table.on(v_participants::internal_user_id.eq(i_users::internal_user_id)),
            )
            .order_by(v_contests::start_epoch_second.desc())
            .limit(RECENT_CONTEST_NUM)
            .select((
                v_contests::id,
                v_contests::title,
                v_contests::memo,
                v_contests::internal_user_id,
                v_contests::start_epoch_second,
                v_contests::duration_second,
                v_items::problem_id.nullable(),
                i_users::atcoder_user_id.nullable(),
            ))
            .load::<VirtualContestTuple>(self)?;
        let virtual_contests = construct_virtual_contests(data);
        Ok(virtual_contests)
    }

    fn get_single_contest(&self, contest_id: &str) -> Result<VirtualContest> {
        let data = v_contests::table
            .left_join(v_items::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)))
            .left_join(
                v_participants::table
                    .on(v_participants::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .left_join(
                i_users::table.on(v_participants::internal_user_id.eq(i_users::internal_user_id)),
            )
            .filter(v_contests::id.eq(contest_id))
            .select((
                v_contests::id,
                v_contests::title,
                v_contests::memo,
                v_contests::internal_user_id,
                v_contests::start_epoch_second,
                v_contests::duration_second,
                v_items::problem_id.nullable(),
                i_users::atcoder_user_id.nullable(),
            ))
            .load::<VirtualContestTuple>(self)?;
        let virtual_contests = construct_virtual_contests(data);
        virtual_contests
            .into_iter()
            .next()
            .ok_or_else(|| Error::InvalidPostRequest)
    }

    fn update_items(&self, contest_id: &str, problem_ids: &[String], user_id: &str) -> Result<()> {
        if problem_ids.len() >= MAX_PROBLEM_NUM_PER_CONTEST {
            return Err(Error::InvalidPostRequest);
        }
        v_contests::table
            .filter(
                v_contests::internal_user_id
                    .eq(user_id)
                    .and(v_contests::id.eq(contest_id)),
            )
            .select(count_star())
            .first::<i64>(self)?;
        delete(v_items::table.filter(v_items::internal_virtual_contest_id.eq(contest_id)))
            .execute(self)?;
        insert_into(v_items::table)
            .values(
                problem_ids
                    .iter()
                    .map(|problem_id| {
                        (
                            v_items::internal_virtual_contest_id.eq(contest_id),
                            v_items::problem_id.eq(problem_id),
                        )
                    })
                    .collect::<Vec<_>>(),
            )
            .execute(self)?;
        Ok(())
    }
    fn join_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()> {
        insert_into(v_participants::table)
            .values(vec![(
                v_participants::internal_virtual_contest_id.eq(contest_id),
                v_participants::internal_user_id.eq(internal_user_id),
            )])
            .execute(self)?;
        Ok(())
    }
}

fn construct_virtual_contests(data: Vec<VirtualContestTuple>) -> Vec<VirtualContest> {
    let mut contest_set = BTreeSet::new();
    let mut problem_map = BTreeMap::new();
    let mut participants = BTreeMap::new();
    for (id, title, memo, owner, start, duration, problem_id, user_id) in data.into_iter() {
        contest_set.insert((id.clone(), title, memo, owner, start, duration));
        if let Some(problem_id) = problem_id {
            problem_map
                .entry(id.clone())
                .or_insert_with(BTreeSet::new)
                .insert(problem_id);
        }
        if let Some(user_id) = user_id {
            participants
                .entry(id)
                .or_insert_with(BTreeSet::new)
                .insert(user_id);
        }
    }

    contest_set
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
        .collect::<Vec<_>>()
}
