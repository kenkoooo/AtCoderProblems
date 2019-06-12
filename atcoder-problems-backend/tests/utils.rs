use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::PgConnection;
use std::fs::File;
use std::io::prelude::*;

const SQL_FILE: &str = "../config/database-definition.sql";
const SQL_URL: &str = "postgresql://kenkoooo:pass@localhost/test";

pub fn connect_to_test_sql() -> PgConnection {
    let mut file = File::open(SQL_FILE).unwrap();
    let mut sql = String::new();
    file.read_to_string(&mut sql).unwrap();
    let conn = PgConnection::establish(SQL_URL).unwrap();
    conn.batch_execute(&sql).unwrap();
    conn
}
