#[macro_use]
extern crate log;
extern crate simple_logger;

#[macro_use]
extern crate lambda_runtime as lambda;
extern crate openssl;

use diesel::connection::SimpleConnection;
use diesel::{Connection, PgConnection};
use lambda::error::HandlerError;
use openssl_probe;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    info!("Started!");
    lambda!(my_handler);

    Ok(())
}

fn my_handler(_: String, c: lambda::Context) -> Result<String, HandlerError> {
    let url = env::var("SQL_URL").map_err(|_| c.new_error("SQL_URL must be set."))?;
    let conn = PgConnection::establish(&url).map_err(|_| c.new_error("Failed to connect."))?;

    conn.batch_execute(
        r#"
            INSERT INTO minimum_performances (minimum_performance, problem_id)
            SELECT 
            MIN(p.inner_performance) AS minimum_performance,
            s.problem_id
            FROM performances AS p
            INNER JOIN submissions AS s
            ON s.user_id=p.user_id AND s.contest_id=p.contest_id
            INNER JOIN contests AS c
            ON c.id=s.contest_id
            WHERE s.result='AC'
            AND p.inner_performance != 0
            AND c.start_epoch_second <= s.epoch_second
            AND s.epoch_second <= c.start_epoch_second + c.duration_second
            GROUP BY s.problem_id
            ON CONFLICT (problem_id) DO NOTHING;
        "#,
    )
    .map_err(|_| c.new_error("Execution Failed."))?;

    Ok("Finished".to_owned())
}
