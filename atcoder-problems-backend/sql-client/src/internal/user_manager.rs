use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use sqlx::postgres::PgRow;
use sqlx::Row;

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct InternalUserInfo {
    pub internal_user_id: String,
    pub atcoder_user_id: Option<String>,
}

#[async_trait]
pub trait UserManager {
    async fn register_user(&self, internal_user_id: &str) -> Result<()>;
    async fn update_internal_user_info(
        &self,
        internal_user_id: &str,
        atcoder_user_id: &str,
    ) -> Result<()>;
    async fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo>;
}

#[async_trait]
impl UserManager for PgPool {
    async fn register_user(&self, internal_user_id: &str) -> Result<()> {
        sqlx::query(
            r"
            INSERT INTO internal_users (internal_user_id)
            VALUES ($1)
            ON CONFLICT DO NOTHING
            ",
        )
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
        sqlx::query(
            r"
            UPDATE internal_users
            SET atcoder_user_id = $1
            WHERE internal_user_id = $2
            ",
        )
        .bind(atcoder_user_id)
        .bind(internal_user_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn get_internal_user_info(&self, internal_user_id: &str) -> Result<InternalUserInfo> {
        let res = sqlx::query(
            r"
            SELECT internal_user_id, atcoder_user_id
            FROM internal_users
            WHERE internal_user_id = $1
            ",
        )
        .bind(internal_user_id)
        .map(|row: PgRow| {
            let internal_user_id: String = row.get(0);
            let atcoder_user_id: Option<String> = row.get(1);
            InternalUserInfo {
                internal_user_id,
                atcoder_user_id,
            }
        })
        .fetch_one(self)
        .await?;
        Ok(res)
    }
}
