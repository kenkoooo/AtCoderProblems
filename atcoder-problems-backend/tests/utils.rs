use sql_client::{initialize_pool, PgPool};
use std::fs::read_to_string;

const SQL_FILE: &str = "../config/database-definition.sql";
const SQL_URL_ENV_KEY: &str = "SQL_URL";

#[cfg(test)]
pub fn get_sql_url_from_env() -> String {
    std::env::var(SQL_URL_ENV_KEY).unwrap()
}

#[cfg(test)]
pub async fn initialize_and_connect_to_test_sql() -> PgPool {
    let conn = initialize_pool(get_sql_url_from_env()).await.unwrap();

    for query_str in read_to_string(SQL_FILE).unwrap().split(";") {
        sql_client::query(query_str).execute(&conn).await.unwrap();
    }
    conn
}
