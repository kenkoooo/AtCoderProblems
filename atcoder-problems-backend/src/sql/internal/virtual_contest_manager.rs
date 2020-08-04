use crate::sql::schema::*;
use anyhow::Result;
use diesel::prelude::*;
use diesel::PgConnection;
use internal_virtual_contest_items as v_items;
use internal_virtual_contests as v_contests;

pub trait VirtualContestManager {
    fn get_running_contest_problems(&self, time: i64) -> Result<Vec<String>>;
}

impl VirtualContestManager for PgConnection {
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
}
