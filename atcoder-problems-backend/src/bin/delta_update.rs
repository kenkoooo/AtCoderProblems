use log::{self, info};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::initialize_pool;
use sql_client::language_count::LanguageCountClient;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::streak::StreakUpdater;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use std::collections::BTreeSet;
use std::env;
use std::error::Error;

#[async_std::main]
async fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    info!("Started!");

    info!("Connecting to SQL ...");
    let url = env::var("SQL_URL")?;
    let conn = initialize_pool(&url).await?;

    info!("Loading submissions ...");
    let request = SubmissionRequest::RecentAccepted { count: 200 };
    let recent_submissions = conn.get_submissions(request).await?;

    let user_ids = recent_submissions
        .into_iter()
        .map(|s| s.user_id)
        .collect::<BTreeSet<_>>();
    let user_ids = user_ids.iter().map(|s| s.as_str()).collect::<Vec<_>>();

    info!("Loading submissions of {} users ...", user_ids.len());
    let request = SubmissionRequest::UsersAccepted {
        user_ids: &user_ids,
    };
    let mut user_accepted_submissions = conn.get_submissions(request).await?;
    info!("There are {} submissions.", user_accepted_submissions.len());

    info!("Sorting by id ...");
    user_accepted_submissions.sort_by_key(|s| s.id);

    info!("Executing update_rated_point_sum...");
    conn.update_rated_point_sum(&user_accepted_submissions)
        .await?;

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&user_accepted_submissions)
        .await?;

    info!("Executing update_language_count...");
    conn.update_language_count(&user_accepted_submissions)
        .await?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&user_accepted_submissions).await?;

    info!("Executing update_submission_count...");
    conn.update_submission_count().await?;

    info!("Finished");
    Ok(())
}
