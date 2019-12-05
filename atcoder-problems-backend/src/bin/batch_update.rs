use atcoder_problems_backend as backend;

use backend::sql::connect;
use backend::sql::models::Submission;
use backend::sql::{
    AcceptedCountClient, LanguageCountClient, ProblemInfoUpdater, ProblemsSubmissionUpdater,
    RatedPointSumClient, StreakUpdater, SubmissionClient, SubmissionRequest,
};

use log::{self, info};
use simple_logger;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    info!("Started!");

    info!("Connecting to SQL ...");
    let url = env::var("SQL_URL")?;
    let conn = connect(&url)?;

    info!("Loading submissions ...");
    let all_accepted_submissions: Vec<Submission> =
        conn.get_submissions(SubmissionRequest::AllAccepted)?;

    info!(
        "There are {} AC submissions.",
        all_accepted_submissions.len()
    );

    info!("Executing update_accepted_count...");
    conn.update_accepted_count(&all_accepted_submissions)?;

    info!("Executing update_problem_solver_count...");
    conn.update_solver_count()?;

    info!("Executing update_submission_count...");
    conn.update_submission_count()?;

    info!("Executing update_rated_point_sums...");
    conn.update_rated_point_sum(&all_accepted_submissions)?;

    info!("Executing update_language_count...");
    conn.update_language_count(&all_accepted_submissions)?;

    info!("Executing update_submissions_of_problems...");
    conn.update_submissions_of_problems()?;

    info!("Executing update_problem_points...");
    conn.update_problem_points()?;

    info!("Executing update_streak_count...");
    conn.update_streak_count(&all_accepted_submissions)?;

    info!("Finished");
    Ok(())
}
