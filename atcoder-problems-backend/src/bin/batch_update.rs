use log::{self, info};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::initialize_pool;
use sql_client::language_count::LanguageCountClient;
use sql_client::models::Submission;
use sql_client::problem_info::ProblemInfoUpdater;
use sql_client::problems_submissions::ProblemsSubmissionUpdater;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::streak::StreakUpdater;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
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
    let mut all_accepted_submissions: Vec<Submission> =
        conn.get_submissions(SubmissionRequest::AllAccepted).await?;

    info!(
        "There are {} AC submissions.",
        all_accepted_submissions.len()
    );

    info!("Sorting by id ...");
    all_accepted_submissions.sort_by_key(|s| s.id);

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&all_accepted_submissions)
        .await?;

    info!("Executing update_problem_solver_count...");
    conn.update_solver_count().await?;

    info!("Executing update_submission_count...");
    conn.update_submission_count().await?;

    info!("Executing update_rated_point_sums...");
    conn.update_rated_point_sum(&all_accepted_submissions)
        .await?;

    let current_count = conn.load_language_count().await?;
    info!("Executing update_language_count...");
    conn.update_language_count(&all_accepted_submissions, &current_count)
        .await?;

    info!("Executing update_submissions_of_problems...");
    conn.update_submissions_of_problems().await?;

    info!("Executing update_problem_points...");
    conn.update_problem_points().await?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&all_accepted_submissions).await?;

    info!("Finished");
    Ok(())
}
