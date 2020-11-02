use sql_client::{initialize_pool, PgPool};
use std::fs::read_to_string;

const SQL_FILE: &str = "../config/database-definition.sql";
pub const SQL_URL: &str = "postgresql://kenkoooo:pass@localhost/test";

#[cfg(test)]
pub async fn initialize_and_connect_to_test_sql() -> PgPool {
    let conn = initialize_pool(SQL_URL).await.unwrap();

    for query_str in read_to_string(SQL_FILE).unwrap().split(";") {
        sql_client::query(query_str).execute(&conn).await.unwrap();
    }
    conn
}
