extern crate openssl; // Just for musl-compiler
use openssl_probe; // Just for musl-compiler

use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::{
    AcceptedCountClient, LanguageCountClient, ProblemInfoUpdater, ProblemsSubmissionUpdater,
    RatedPointSumClient, StreakUpdater, SubmissionClient, SubmissionRequest,
};
use diesel::{Connection, PgConnection};
use lambda_runtime::error::HandlerError;
use lambda_runtime::lambda;
use lambda_runtime::Context;
use log::{self, info};
use simple_logger;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    openssl_probe::init_ssl_cert_env_vars(); // Just for musl-compiler
    simple_logger::init_with_level(log::Level::Info)?;
    lambda!(handler);
    Ok(())
}

fn handler(_: String, _: Context) -> Result<String, HandlerError> {
    info!("Started!");

    info!("Connecting to SQL ...");
    let url = env::var("SQL_URL")?;
    let conn = PgConnection::establish(&url).herr()?;

    info!("Loading submissions ...");
    let all_accepted_submissions: Vec<Submission> = conn
        .get_submissions(SubmissionRequest::AllAccepted)
        .herr()?;

    info!(
        "There are {} AC submissions.",
        all_accepted_submissions.len()
    );

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&all_accepted_submissions)
        .herr()?;

    info!("Executing update_problem_solver_count...");
    conn.update_solver_count().herr()?;

    info!("Executing update_rated_point_sums...");
    conn.update_rated_point_sum(&all_accepted_submissions)
        .herr()?;

    info!("Executing update_language_count...");
    conn.update_language_count(&all_accepted_submissions)
        .herr()?;

    info!("Executing update_submissions_of_problems...");
    conn.update_submissions_of_problems(&all_accepted_submissions)
        .herr()?;

    info!("Executing update_problem_points...");
    conn.update_problem_points().herr()?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&all_accepted_submissions).herr()?;

    info!("Finished");
    Ok("Finished".to_owned())
}
