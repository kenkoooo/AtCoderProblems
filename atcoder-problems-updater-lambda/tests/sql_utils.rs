use diesel::connection::SimpleConnection;
use diesel::Connection;
use diesel::PgConnection;
use std::fs::File;
use std::io::prelude::*;

const URL: &str = "postgresql://kenkoooo:pass@localhost/test";

fn read_file(path: &str) -> String {
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}

pub fn setup_test_db() {
    let conn = PgConnection::establish(URL).unwrap();
    let sql = read_file("../config/database-definition.sql");
    conn.batch_execute(&sql).unwrap();
}

pub fn connect_to_test() -> PgConnection {
    PgConnection::establish(URL).expect(
        r"
            Please prepare a database on your localhost with the following properties.
            database:   test
            username:   kenkoooo
            password:   pass
            ",
    )
}
