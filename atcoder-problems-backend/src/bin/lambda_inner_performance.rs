use atcoder_problems_backend::error::MapHandlerError;
use diesel::connection::SimpleConnection;
use diesel::{Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use simple_logger;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    info!("Started!");
    lambda!(handler);

    Ok(())
}

fn handler(_: String, _: Context) -> Result<String, HandlerError> {
    let url = env::var("SQL_URL")?;
    let conn = PgConnection::establish(&url).map_handler_error()?;

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
    .map_handler_error()?;

    Ok("Finished".to_owned())
}
