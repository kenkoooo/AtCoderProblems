use std::time::Duration;

pub mod internal;
pub mod error;

use error::SqlClientError;

pub type PgPool = sqlx::postgres::PgPool;
pub type SqlClientResult<T> = std::result::Result<T, SqlClientError>;

pub async fn initialize_pool<S: AsRef<str>>(database_url: S) -> SqlClientResult<PgPool> {
    let pool = PgPool::builder()
        .max_lifetime(Some(Duration::from_secs(60 * 5)))
        .max_size(15)
        .build(database_url.as_ref())
        .await?;
    Ok(pool)
}

