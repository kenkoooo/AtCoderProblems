use crate::error::Result;
use crate::sql::schema::internal_progress_reset as r_table;

use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{delete, insert_into, PgConnection};
use serde::Serialize;

#[derive(Serialize)]
pub(crate) struct ProgressResetList {
    items: Vec<ProgressResetItem>,
}

#[derive(Serialize)]
pub(crate) struct ProgressResetItem {
    problem_id: String,
    reset_epoch_second: i64,
}

pub(crate) trait ProgressResetManager {
    fn add_item(
        &self,
        internal_user_id: &str,
        problem_id: &str,
        reset_epoch_second: i64,
    ) -> Result<()>;
    fn remove_item(&self, internal_user_id: &str, problem_id: &str) -> Result<()>;
    fn get_progress_reset_list(&self, internal_user_id: &str) -> Result<ProgressResetList>;
}

impl ProgressResetManager for PgConnection {
    fn add_item(
        &self,
        internal_user_id: &str,
        problem_id: &str,
        reset_epoch_second: i64,
    ) -> Result<()> {
        insert_into(r_table::table)
            .values((
                r_table::internal_user_id.eq(internal_user_id),
                r_table::problem_id.eq(problem_id),
                r_table::reset_epoch_second.eq(reset_epoch_second),
            ))
            .on_conflict((r_table::internal_user_id, r_table::problem_id))
            .do_update()
            .set(r_table::reset_epoch_second.eq(excluded(r_table::reset_epoch_second)))
            .execute(self)?;
        Ok(())
    }
    fn remove_item(&self, internal_user_id: &str, problem_id: &str) -> Result<()> {
        delete(
            r_table::table.filter(
                r_table::internal_user_id
                    .eq(internal_user_id)
                    .and(r_table::problem_id.eq(problem_id)),
            ),
        )
        .execute(self)?;
        Ok(())
    }
    fn get_progress_reset_list(&self, internal_user_id: &str) -> Result<ProgressResetList> {
        let items = r_table::table
            .filter(r_table::internal_user_id.eq(internal_user_id))
            .select((r_table::problem_id, r_table::reset_epoch_second))
            .load::<(String, i64)>(self)?
            .into_iter()
            .map(|(problem_id, reset_epoch_second)| ProgressResetItem {
                problem_id,
                reset_epoch_second,
            })
            .collect::<Vec<_>>();
        Ok(ProgressResetList { items })
    }
}
