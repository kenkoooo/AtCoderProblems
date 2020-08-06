use crate::sql::schema::*;
use anyhow::Result;
use diesel::prelude::*;
use diesel::{insert_into, update, PgConnection};
use serde::Serialize;

#[derive(Debug, QueryableByName, Queryable, Serialize)]
#[table_name = "internal_users"]
pub(crate) struct InternalUserInfo {
    internal_user_id: String,
    atcoder_user_id: Option<String>,
}

pub(crate) trait UserManager {
    fn register_user(&self, internal_user_id: &str) -> Result<()>;
    fn update_internal_user_info(
        &self,
        internal_user_id: &str,
        atcoder_user_id: &str,
    ) -> Result<()>;
    fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo>;
}

impl UserManager for PgConnection {
    fn register_user(&self, internal_user_id: &str) -> Result<()> {
        insert_into(internal_users::table)
            .values(vec![internal_users::internal_user_id.eq(internal_user_id)])
            .on_conflict_do_nothing()
            .execute(self)?;
        Ok(())
    }
    fn update_internal_user_info(
        &self,
        internal_user_id: &str,
        atcoder_user_id: &str,
    ) -> Result<()> {
        update(internal_users::table.filter(internal_users::internal_user_id.eq(internal_user_id)))
            .set(internal_users::atcoder_user_id.eq(atcoder_user_id))
            .execute(self)?;
        Ok(())
    }
    fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo> {
        let user_info = internal_users::table
            .filter(internal_users::internal_user_id.eq(internal_user_id))
            .first::<InternalUserInfo>(self)?;
        Ok(user_info)
    }
}
