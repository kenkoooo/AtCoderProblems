use crate::error::Result;
use crate::sql::schema::*;

use diesel::prelude::*;
use diesel::{insert_into, PgConnection};

pub(crate) trait UserManager {
    fn register_user(&self, internal_user_id: &str) -> Result<()>;
}

impl UserManager for PgConnection {
    fn register_user(&self, internal_user_id: &str) -> Result<()> {
        insert_into(internal_users::table)
            .values(vec![internal_users::internal_user_id.eq(internal_user_id)])
            .on_conflict_do_nothing()
            .execute(self)?;
        Ok(())
    }
}
