use atcoder_problems_backend::server::{initialize_pool, run_server, Authentication};

use async_std::task;
use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::PgConnection;

use std::fs::File;
use std::future::Future;
use std::io::prelude::*;

const SQL_FILE: &str = "../config/database-definition.sql";
pub const SQL_URL: &str = "postgresql://kenkoooo:pass@localhost/test";

#[cfg(test)]
pub fn connect_to_test_sql() -> PgConnection {
    let conn = PgConnection::establish(SQL_URL).unwrap();
    initialize(&conn);
    conn
}

fn initialize(conn: &PgConnection) {
    let mut file = File::open(SQL_FILE).unwrap();
    let mut sql = String::new();
    file.read_to_string(&mut sql).unwrap();
    conn.batch_execute(&sql).unwrap();
}

#[cfg(test)]
pub fn start_server_handle<A>(
    auth: A,
    port: u16,
) -> task::JoinHandle<std::result::Result<(), surf::Exception>>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    task::spawn(async move {
        let pool = initialize_pool(SQL_URL).unwrap();
        run_server(pool, auth, port).await.unwrap();
        Ok(())
    })
}

#[cfg(test)]
pub fn run_client_handle<F>(future: F) -> task::JoinHandle<std::result::Result<(), surf::Exception>>
where
    F: Future<Output = std::result::Result<(), surf::Exception>> + Send + 'static,
{
    task::spawn(async {
        task::sleep(std::time::Duration::from_millis(1000)).await;
        future.await
    })
}
