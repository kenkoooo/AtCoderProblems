use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::{
    AcceptedCountUpdater, LanguageCountUpdater, RatedPointSumUpdater, SubmissionClient,
    SubmissionRequest,
};
use diesel::expression::IntoSql;
use diesel::{Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use simple_logger;
use std::collections::BTreeSet;
use std::env;
use std::error::Error;

const WINDOW_SECOND: i64 = 60 * 15;

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

    info!("Connected");

    let request = SubmissionRequest::RecentAccepted { count: 1000 };
    let recent_submissions = conn.get_submissions(request).map_handler_error()?;
    info!("There are latest {} submissions.", recent_submissions.len());
    let latest_second = recent_submissions
        .iter()
        .map(|s| s.epoch_second)
        .max()
        .unwrap();
    let recent_submissions: Vec<Submission> = recent_submissions
        .into_iter()
        .filter(|s| s.epoch_second > latest_second - WINDOW_SECOND)
        .collect::<Vec<_>>();
    info!("There are {} submissions.", recent_submissions.len());

    let user_ids = recent_submissions
        .into_iter()
        .map(|s| s.user_id)
        .collect::<BTreeSet<_>>();
    let user_ids = user_ids.iter().map(|s| s.as_str()).collect::<Vec<_>>();
    let request = SubmissionRequest::UsersAccepted {
        user_ids: &user_ids,
    };
    let user_submissions = conn.get_submissions(request).map_handler_error()?;

    info!("There are {} submissions.", user_submissions.len());

    info!("Executing update_rated_point_sum...");
    conn.update_rated_point_sum(&user_submissions)
        .map_handler_error()?;

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&user_submissions)
        .map_handler_error()?;

    info!("Executing update_language_count...");
    conn.update_language_count(&user_submissions)
        .map_handler_error()?;
    info!("Finished");

    Ok("Finished".to_owned())
}
