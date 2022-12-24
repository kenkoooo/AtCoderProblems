use atcoder_problems_backend::utils::{init_log_config, EXCLUDED_USERS};
use log::info;
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::language_count::LanguageCountClient;
use sql_client::models::Submission;
use sql_client::problem_info::ProblemInfoUpdater;
use sql_client::problems_submissions::ProblemsSubmissionUpdater;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::streak::StreakClient;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use sql_client::{initialize_pool, PgPool};
use std::env;
use std::error::Error;

async fn clean_up_ranking(conn: &PgPool) -> anyhow::Result<()> {
    // AtCoderアカウントの名前を変更すると、`submissions`テーブルに存在する古い名前が新しい名前に変更される。
    // `accepted_count`などを更新する処理は提出データの更新を想定しておらず、古い名前のデータが残ってしまうので、ここで削除する。
    for table_name in [
        "accepted_count",
        "rated_point_sum",
        "language_count",
        "max_streaks",
    ] {
        sql_client::query(&format!(
            "
            DELETE FROM {table_name} WHERE NOT EXISTS (
                SELECT user_id FROM submissions WHERE {table_name}.user_id = submissions.user_id
            )
            "
        ))
        .execute(conn)
        .await?;
    }

    Ok(())
}

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    init_log_config()?;
    info!("Started!");

    info!("Connecting to SQL ...");
    let url = env::var("SQL_URL")?;
    let conn = initialize_pool(&url).await?;

    info!("Loading submissions ...");
    let mut all_accepted_submissions: Vec<Submission> =
        conn.get_submissions(SubmissionRequest::AllAccepted).await?;

    info!("Filter submission by user_id ...");
    all_accepted_submissions = all_accepted_submissions
        .into_iter()
        .filter(|submission| !EXCLUDED_USERS.contains(&submission.user_id.as_str()))
        .collect::<Vec<_>>();

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

    info!("Executing clean_up_disappeared_users...");
    clean_up_ranking(&conn).await?;

    info!("Finished");
    Ok(())
}
