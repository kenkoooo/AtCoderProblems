use crate::error::Result;
use crate::sql::schema::*;

use crate::error::ErrorTypes::InvalidRequest;
use diesel::expression::dsl::count_star;
use diesel::prelude::*;
use diesel::Queryable;
use diesel::{delete, insert_into, update, PgConnection};
use internal_users as i_users;
use internal_virtual_contest_items as v_items;
use internal_virtual_contest_participants as v_participants;
use internal_virtual_contests as v_contests;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use uuid::Uuid;

const MAX_PROBLEM_NUM_PER_CONTEST: usize = 100;
const RECENT_CONTEST_NUM: i64 = 1000;

type VirtualContestTuple = (
    String,         //id
    String,         //title
    String,         //memo
    String,         //user_id
    i64,            //start
    i64,            //duration
    Option<String>, //problem_id
    Option<String>, //atcoder_user_id
    Option<String>, //mode
    Option<i64>,    //point
    Option<i64>,    //order
);

#[derive(Serialize, Queryable)]
pub struct VirtualContestInfo {
    pub(crate) id: String,
    pub(crate) title: String,
    pub(crate) memo: String,

    #[column_name = "internal_user_id"]
    pub(crate) owner_user_id: String,
    pub(crate) start_epoch_second: i64,
    pub(crate) duration_second: i64,
    pub(crate) mode: Option<String>,

    pub(crate) is_public: bool,
}

#[deprecated(note = "want to migrate to VirtualContestInfo")]
#[derive(Serialize)]
pub struct VirtualContest {
    id: String,
    title: String,
    memo: String,
    owner_user_id: String,
    pub(crate) start_epoch_second: i64,
    pub(crate) duration_second: i64,
    mode: Option<String>,
    pub(crate) problems: Vec<VirtualContestItem>,
    participants: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct VirtualContestItem {
    pub(crate) id: String,
    point: Option<i64>,
    order: Option<i64>,
}

pub trait VirtualContestManager {
    fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
    ) -> Result<String>;
    fn update_contest(
        &self,
        id: &str,
        title: &str,
        memo: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
    ) -> Result<()>;

    fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
    fn get_participated_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContest>>;
    fn get_single_contest_info(&self, contest_id: &str) -> Result<VirtualContestInfo>;
    fn get_single_contest_participants(&self, contest_id: &str) -> Result<Vec<String>>;
    fn get_single_contest_problems(&self, contest_id: &str) -> Result<Vec<VirtualContestItem>>;
    fn get_recent_contest_info(&self) -> Result<Vec<VirtualContestInfo>>;
    fn get_running_contest_problems(&self, time: i64) -> Result<Vec<String>>;

    fn update_items(
        &self,
        contest_id: &str,
        problems: &[VirtualContestItem],
        user_id: &str,
    ) -> Result<()>;

    fn join_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()>;
    fn leave_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()>;
}

impl VirtualContestManager for PgConnection {
    fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
    ) -> Result<String> {
        let uuid = Uuid::new_v4().to_string();
        insert_into(v_contests::table)
            .values(vec![(
                v_contests::id.eq(&uuid),
                v_contests::title.eq(title),
                v_contests::memo.eq(memo),
                v_contests::internal_user_id.eq(internal_user_id),
                v_contests::start_epoch_second.eq(start_epoch_second),
                v_contests::duration_second.eq(duration_second),
                v_contests::mode.eq(mode),
                v_contests::is_public.eq(is_public),
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
        mode: Option<&str>,
        is_public: bool,
    ) -> Result<()> {
        update(v_contests::table.filter(v_contests::id.eq(id)))
            .set((
                v_contests::title.eq(title),
                v_contests::memo.eq(memo),
                v_contests::start_epoch_second.eq(start_epoch_second),
                v_contests::duration_second.eq(duration_second),
                v_contests::mode.eq(mode),
                v_contests::is_public.eq(is_public),
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
                v_contests::mode,
                v_items::user_defined_point,
                v_items::user_defined_order,
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
                v_contests::mode,
                v_items::user_defined_point,
                v_items::user_defined_order,
            ))
            .load::<VirtualContestTuple>(self)?;
        let virtual_contests = construct_virtual_contests(data);
        Ok(virtual_contests)
    }

    fn get_running_contest_problems(&self, time: i64) -> Result<Vec<String>> {
        let problem_ids = v_items::table
            .left_join(
                v_contests::table.on(v_items::internal_virtual_contest_id.eq(v_contests::id)),
            )
            .filter(v_contests::start_epoch_second.le(time))
            .filter((v_contests::start_epoch_second + v_contests::duration_second).ge(time))
            .select(v_items::problem_id)
            .load::<String>(self)?;
        Ok(problem_ids)
    }

    fn get_recent_contest_info(&self) -> Result<Vec<VirtualContestInfo>> {
        let data = v_contests::table
            .filter(v_contests::is_public.eq(true))
            .order_by((v_contests::start_epoch_second + v_contests::duration_second).desc())
            .limit(RECENT_CONTEST_NUM)
            .load::<VirtualContestInfo>(self)?;
        Ok(data)
    }

    fn get_single_contest_info(&self, contest_id: &str) -> Result<VirtualContestInfo> {
        v_contests::table
            .filter(v_contests::id.eq(contest_id))
            .load::<VirtualContestInfo>(self)?
            .into_iter()
            .next()
            .ok_or_else(|| InvalidRequest.into())
    }

    fn get_single_contest_participants(&self, contest_id: &str) -> Result<Vec<String>> {
        let participants = v_participants::table
            .filter(v_participants::internal_virtual_contest_id.eq(contest_id))
            .left_join(
                i_users::table.on(v_participants::internal_user_id.eq(i_users::internal_user_id)),
            )
            .select(i_users::atcoder_user_id.nullable())
            .filter(i_users::atcoder_user_id.is_not_null())
            .order_by(i_users::atcoder_user_id.nullable().asc())
            .load::<Option<String>>(self)?
            .into_iter()
            .filter_map(|participant| participant)
            .collect::<Vec<String>>();
        Ok(participants)
    }

    fn get_single_contest_problems(&self, contest_id: &str) -> Result<Vec<VirtualContestItem>> {
        let problems = v_items::table
            .filter(v_items::internal_virtual_contest_id.eq(contest_id))
            .select((
                v_items::problem_id,
                v_items::user_defined_point,
                v_items::user_defined_order,
            ))
            .order_by(v_items::user_defined_order.nullable().asc())
            .then_order_by(v_items::problem_id.asc())
            .load::<(String, Option<i64>, Option<i64>)>(self)?
            .into_iter()
            .map(|(id, point, order)| VirtualContestItem { id, point, order })
            .collect::<Vec<VirtualContestItem>>();
        Ok(problems)
    }

    fn update_items(
        &self,
        contest_id: &str,
        problems: &[VirtualContestItem],
        user_id: &str,
    ) -> Result<()> {
        if problems.len() > MAX_PROBLEM_NUM_PER_CONTEST {
            return Err(http_types::Error::from(InvalidRequest));
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
                problems
                    .iter()
                    .map(|problem| {
                        (
                            v_items::internal_virtual_contest_id.eq(contest_id),
                            v_items::problem_id.eq(problem.id.as_str()),
                            v_items::user_defined_point.eq(problem.point),
                            v_items::user_defined_order.eq(problem.order),
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
    fn leave_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()> {
        delete(
            v_participants::table
                .filter(v_participants::internal_virtual_contest_id.eq(contest_id))
                .filter(v_participants::internal_user_id.eq(internal_user_id)),
        )
        .execute(self)?;
        Ok(())
    }
}

fn construct_virtual_contests(data: Vec<VirtualContestTuple>) -> Vec<VirtualContest> {
    let mut contest_set = BTreeSet::new();
    let mut problem_map = BTreeMap::new();
    let mut participants = BTreeMap::new();
    for (id, title, memo, owner, start, duration, problem_id, user_id, mode, point, order) in
        data.into_iter()
    {
        contest_set.insert((id.clone(), title, memo, owner, start, duration, mode));
        if let Some(problem_id) = problem_id {
            problem_map
                .entry(id.clone())
                .or_insert_with(BTreeSet::new)
                .insert((problem_id, point, order));
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
            |(id, title, memo, owner_user_id, start_epoch_second, duration_second, mode)| {
                let problems = problem_map
                    .get(&id)
                    .map(|set| {
                        set.iter()
                            .cloned()
                            .map(|(problem_id, point, order)| VirtualContestItem {
                                id: problem_id,
                                point,
                                order,
                            })
                            .collect::<Vec<_>>()
                    })
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
                    mode,
                }
            },
        )
        .collect::<Vec<_>>()
}
