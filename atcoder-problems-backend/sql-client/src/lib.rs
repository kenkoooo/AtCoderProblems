use anyhow::Result;
use std::time::Duration;

pub mod accepted_count;
pub mod contest_problem;
pub mod internal;
pub mod language_count;
pub mod models;

pub type PgPool = sqlx::postgres::PgPool;

const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
const UNRATED_STATE: &str = "-";
const MAX_INSERT_ROWS: usize = 10_000;

pub async fn initialize_pool<S: AsRef<str>>(database_url: S) -> Result<PgPool> {
    let pool = PgPool::builder()
        .max_lifetime(Some(Duration::from_secs(60 * 5)))
        .max_size(15)
        .build(database_url.as_ref())
        .await?;
    Ok(pool)
}
