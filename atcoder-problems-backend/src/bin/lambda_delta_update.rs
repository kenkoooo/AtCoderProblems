extern crate openssl;

use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::{
    AcceptedCountClient, LanguageCountClient, RatedPointSumClient, StreakUpdater, SubmissionClient,
    SubmissionRequest,
};
use diesel::{Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use simple_logger;
use std::collections::BTreeSet;
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

    info!("Connected");

    let request = SubmissionRequest::RecentAccepted { count: 1000 };
    let recent_submissions = conn.get_submissions(request).map_handler_error()?;
    info!("There are {} submissions.", recent_submissions.len());

    let user_ids = recent_submissions
        .into_iter()
        .map(|s| s.user_id)
        .collect::<BTreeSet<_>>();
    let user_ids = user_ids.iter().map(|s| s.as_str()).collect::<Vec<_>>();
    info!("There are {} users to update", user_ids.len());

    let request = SubmissionRequest::UsersAccepted {
        user_ids: &user_ids,
    };
    let user_accepted_submissions = conn.get_submissions(request).map_handler_error()?;
    info!(
        "There are {} submissions to use.",
        user_accepted_submissions.len()
    );

    info!("Executing update_rated_point_sum...");
    conn.update_rated_point_sum(&user_accepted_submissions)
        .map_handler_error()?;

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&user_accepted_submissions)
        .map_handler_error()?;

    info!("Executing update_language_count...");
    conn.update_language_count(&user_accepted_submissions)
        .map_handler_error()?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&user_accepted_submissions)
        .map_handler_error()?;

    info!("Finished");

    Ok("Finished".to_owned())
}
