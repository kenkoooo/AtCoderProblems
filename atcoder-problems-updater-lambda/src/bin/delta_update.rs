#[macro_use]
extern crate log;
extern crate simple_logger;

#[macro_use]
extern crate lambda_runtime as lambda;
extern crate openssl;

use atcoder_problems_updater_lambda::delta_updater::DeltaUpdater;
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

    info!("Connected");

    let recent_submissions = conn.get_recent_submissions(1000).lambda_err(&c)?;
    let user_submissions = conn
        .get_user_submissions(&recent_submissions)
        .lambda_err(&c)?;

    info!("There are {} submissions.", user_submissions.len());

    info!("Executing delta_update_rated_point_sum...");
    conn.delta_update_rated_point_sum(&user_submissions)
        .lambda_err(&c)?;

    info!("Executing delta_update_accepted_count...");
    conn.delta_update_accepted_count(&user_submissions)
        .lambda_err(&c)?;

    info!("Executing delta_update_language_count...");
    conn.delta_update_language_count(&user_submissions)
        .lambda_err(&c)?;
    info!("Finished");

    Ok("Finished".to_owned())
}

trait ErrorMapper<T> {
    fn lambda_err(self, c: &lambda::Context) -> Result<T, HandlerError>;
}

impl<T, E> ErrorMapper<T> for Result<T, E>
where
    E: std::fmt::Debug,
{
    fn lambda_err(self, c: &lambda::Context) -> Result<T, HandlerError> {
        self.map_err(|e| c.new_error(&format!("{:?}", e)))
    }
}
