use sql_client::PgPool;
use sqlx::Executor;
use std::fs::File;
use std::io::prelude::*;

const SQL_FILE: &str = "../../config/database-definition.sql";
// TODO(magurotuna): change this to `postgresql://kenkoooo:pass@localhost/test`
pub const SQL_URL: &str = "postgresql://db_user:password@localhost/db";

pub async fn initialize_and_connect_to_test_sql() -> PgPool {
    let pool = sql_client::initialize_pool(SQL_URL).await.unwrap();
    initialize(&pool).await;
    pool
}

async fn initialize(pool: &PgPool) {
    let mut file = File::open(SQL_FILE).unwrap();
    let mut sql = String::new();
    file.read_to_string(&mut sql).unwrap();
    let mut conn = pool.acquire().await.unwrap();
    conn.execute(sql.as_str()).await.unwrap();
}
