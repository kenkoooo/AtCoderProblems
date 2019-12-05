use atcoder_problems_backend::server::AppData;
use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::PgConnection;
use std::fs::File;
use std::io::prelude::*;

const SQL_FILE: &str = "../config/database-definition.sql";
const SQL_URL: &str = "postgresql://kenkoooo:pass@localhost/test";

pub fn connect_to_test_sql() -> PgConnection {
    let conn = PgConnection::establish(SQL_URL).unwrap();
    initialize(&conn);
    conn
}

pub fn connect_to_test_sql_pool() -> AppData {
    let data = AppData::new(SQL_URL).unwrap();
    let conn = data.pool.get().unwrap();
    initialize(&conn);
    data
}

fn initialize(conn: &PgConnection) {
    let mut file = File::open(SQL_FILE).unwrap();
    let mut sql = String::new();
    file.read_to_string(&mut sql).unwrap();
    conn.batch_execute(&sql).unwrap();
}
