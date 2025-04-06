use crawler::{CrawlerClient, Submission};
use sea_orm::{Database, DatabaseConnection, EntityTrait, Set, sea_query::OnConflict};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();
    let db = setup_db().await.expect("Failed to connect to database");
    let crawler = setup_crawler().expect("Failed to create crawler");

    let contests = sql_entities::contests::Entity::find()
        .all(&db)
        .await
        .expect("Failed to load contests");
    for contest in contests {
        tracing::info!("Fetching submissions for contest {}", contest.id);
        for page in 1.. {
            tracing::info!(
                "Fetching submissions for contest {} page {}",
                contest.id,
                page
            );
            let submissions = fetch_submissions(&crawler, &contest.id, page).await;
            if submissions.is_empty() {
                tracing::info!("No more submissions for contest {}", contest.id);
                break;
            }

            tracing::info!("Inserting {} submissions", submissions.len());
            for submission in submissions {
                let submission = sql_entities::submissions::ActiveModel {
                    id: Set(submission.id),
                    epoch_second: Set(submission.epoch_second),
                    problem_id: Set(submission.problem_id),
                    contest_id: Set(submission.contest_id),
                    user_id: Set(submission.user),
                    language: Set(submission.language),
                    point: Set(submission.score.parse().expect("Failed to parse score")),
                    length: Set(submission.code_length),
                    result: Set(submission.result),
                    execution_time: Set(submission.execution_time),
                };
                sql_entities::submissions::Entity::insert(submission)
                    .on_conflict(
                        OnConflict::column(sql_entities::submissions::Column::Id)
                            .update_columns([
                                sql_entities::submissions::Column::EpochSecond,
                                sql_entities::submissions::Column::ProblemId,
                                sql_entities::submissions::Column::ContestId,
                                sql_entities::submissions::Column::UserId,
                                sql_entities::submissions::Column::Language,
                                sql_entities::submissions::Column::Point,
                                sql_entities::submissions::Column::Length,
                                sql_entities::submissions::Column::Result,
                                sql_entities::submissions::Column::ExecutionTime,
                            ])
                            .to_owned(),
                    )
                    .exec(&db)
                    .await
                    .expect("Failed to insert submissions");
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }

        tracing::info!("Finished fetching submissions for contest {}", contest.id);
    }
}

async fn fetch_submissions(
    crawler: &CrawlerClient,
    contest_id: &str,
    page: i32,
) -> Vec<Submission> {
    const MAX_RETRIES: u32 = 3;
    let mut retry_count = 0;
    let mut retry_delay = 100;

    while retry_count < MAX_RETRIES {
        match crawler.fetch_submissions(contest_id, page).await {
            Ok(submissions) => {
                return submissions;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch submissions (attempt {}/{}): {}",
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!("Failed to fetch submissions after {} retries", MAX_RETRIES);
    vec![]
}

async fn setup_db() -> Result<DatabaseConnection> {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;
    Ok(db)
}

fn setup_crawler() -> Result<CrawlerClient> {
    let revel_session = std::env::var("REVEL_SESSION").expect("REVEL_SESSION must be set");
    let crawler = CrawlerClient::new(revel_session)?;
    Ok(crawler)
}
