use crate::error::Result;
use crate::server::PooledConnection;

use async_trait::async_trait;
use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub(crate) struct InternalUserInfo {
    internal_user_id: String,
    atcoder_user_id: Option<String>,
}

#[async_trait]
pub(crate) trait UserManager {
    async fn register_user(&self, internal_user_id: &str) -> Result<()>;
    async fn update_internal_user_info(
        &self,
        internal_user_id: &str,
        atcoder_user_id: &str,
    ) -> Result<()>;
    async fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo>;
}

#[async_trait]
impl UserManager for PooledConnection {
    async fn register_user(&self, internal_user_id: &str) -> Result<()> {
        sqlx::query("INSERT INTO internal_users (internal_user_id) VALUES ($1)")
            .bind(internal_user_id)
            .execute(self)
            .await?;
        Ok(())
    }
    async fn update_internal_user_info(
        &self,
        internal_user_id: &str,
        atcoder_user_id: &str,
    ) -> Result<()> {
        sqlx::query("UPDATE internal_users SET atcoder_user_id = $1, WHERE internal_user_id = $2")
            .bind(atcoder_user_id)
            .bind(internal_user_id)
            .execute(self)
            .await?;
        Ok(())
    }
    async fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo> {
        let user_info: InternalUserInfo =
            sqlx::query_as("SELECT * FROM internal_users WHERE internal_user_id = $1")
                .bind(internal_user_id)
                .first(self)
                .await?;
        Ok(user_info)
    }
}
