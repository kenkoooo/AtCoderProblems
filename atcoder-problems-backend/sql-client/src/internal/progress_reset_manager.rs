use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use sqlx::postgres::PgRow;
use sqlx::Row;

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct ProgressResetList {
    pub items: Vec<ProgressResetItem>,
}

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct ProgressResetItem {
    pub problem_id: String,
    pub reset_epoch_second: i64,
}

#[async_trait]
pub trait ProgressResetManager {
    async fn add_item(
        &self,
        internal_user_id: &str,
        problem_id: &str,
        reset_epoch_second: i64,
    ) -> Result<()>;
    async fn remove_item(&self, internal_user_id: &str, problem_id: &str) -> Result<()>;
    async fn get_progress_reset_list(&self, internal_user_id: &str) -> Result<ProgressResetList>;
}

#[async_trait]
impl ProgressResetManager for PgPool {
    async fn add_item(
        &self,
        internal_user_id: &str,
        problem_id: &str,
        reset_epoch_second: i64,
    ) -> Result<()> {
        sqlx::query(
            r"
            INSERT INTO internal_progress_reset (internal_user_id, problem_id, reset_epoch_second)
            VALUES ($1, $2, $3)
            ON CONFLICT (internal_user_id, problem_id)
            DO UPDATE SET reset_epoch_second = EXCLUDED.reset_epoch_second
            ",
        )
        .bind(internal_user_id)
        .bind(problem_id)
        .bind(reset_epoch_second)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn remove_item(&self, internal_user_id: &str, problem_id: &str) -> Result<()> {
        sqlx::query(
            r"
            DELETE FROM internal_progress_reset
            WHERE internal_user_id = $1
            AND problem_id = $2
            ",
        )
        .bind(internal_user_id)
        .bind(problem_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn get_progress_reset_list(&self, internal_user_id: &str) -> Result<ProgressResetList> {
        let items = sqlx::query(
            r"
            SELECT problem_id, reset_epoch_second
            FROM internal_progress_reset
            WHERE internal_user_id = $1
            ",
        )
        .bind(internal_user_id)
        .try_map(|row: PgRow| {
            let problem_id: String = row.try_get("problem_id")?;
            let reset_epoch_second: i64 = row.try_get("reset_epoch_second")?;
            Ok(ProgressResetItem {
                problem_id,
                reset_epoch_second,
            })
        })
        .fetch_all(self)
        .await?;
        Ok(ProgressResetList { items })
    }
}
