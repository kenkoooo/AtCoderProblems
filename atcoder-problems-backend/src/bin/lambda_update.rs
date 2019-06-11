use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::update::SqlUpdater;
use atcoder_problems_backend::sql::{
    AcceptedCountClient, LanguageCountClient, ProblemInfoAggregator, RatedPointSumUpdater,
    SubmissionClient, SubmissionRequest,
};
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
    let conn: PgConnection = PgConnection::establish(&url).map_handler_error()?;

    let submissions: Vec<Submission> = conn
        .get_submissions(SubmissionRequest::AllAccepted)
        .map_handler_error()?;

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&submissions)
        .map_handler_error()?;

    info!("Executing update_problem_solver_count...");
    conn.update_problem_solver_count().map_handler_error()?;

    info!("Executing update_rated_point_sums...");
    conn.update_rated_point_sum(&submissions)
        .map_handler_error()?;

    info!("Executing update_language_count...");
    conn.update_language_count(&submissions)
        .map_handler_error()?;

    info!("Executing update_fastest_submissions...");
    conn.update_fastest_submissions(&submissions)
        .map_handler_error()?;
    info!("Executing update_first_submissions...");
    conn.update_first_submissions(&submissions)
        .map_handler_error()?;
    info!("Executing update_shortest_submissions...");
    conn.update_shortest_submissions(&submissions)
        .map_handler_error()?;

    info!("Executing update_problem_points...");
    conn.update_problem_points().map_handler_error()?;

    Ok("Finished".to_owned())
}
