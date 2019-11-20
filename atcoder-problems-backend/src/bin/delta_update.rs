extern crate openssl; // Just for musl-compiler
use openssl_probe; // Just for musl-compiler

use atcoder_problems_backend::sql::{
    AcceptedCountClient, LanguageCountClient, RatedPointSumClient, StreakUpdater, SubmissionClient,
    SubmissionRequest,
};
use diesel::{Connection, PgConnection};
use log::{self, info};
use simple_logger;
use std::collections::BTreeSet;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    openssl_probe::init_ssl_cert_env_vars(); // Just for musl-compiler

    simple_logger::init_with_level(log::Level::Info)?;
    info!("Started!");

    info!("Connecting to SQL ...");
    let url = env::var("SQL_URL")?;
    let conn = PgConnection::establish(&url)?;

    info!("Loading submissions ...");
    let request = SubmissionRequest::RecentAccepted { count: 1000 };
    let recent_submissions = conn.get_submissions(request)?;

    let user_ids = recent_submissions
        .into_iter()
        .map(|s| s.user_id)
        .collect::<BTreeSet<_>>();
    let user_ids = user_ids.iter().map(|s| s.as_str()).collect::<Vec<_>>();

    info!("Loading submissions of {} users ...", user_ids.len());
    let request = SubmissionRequest::UsersAccepted {
        user_ids: &user_ids,
    };
    let user_accepted_submissions = conn.get_submissions(request)?;

    info!("Executing update_rated_point_sum...");
    conn.update_rated_point_sum(&user_accepted_submissions)?;

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&user_accepted_submissions)?;

    info!("Executing update_language_count...");
    conn.update_language_count(&user_accepted_submissions)?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&user_accepted_submissions)?;

    info!("Executing update_submission_count...");
    conn.update_submission_count()?;

    info!("Finished");
    Ok(())
}
