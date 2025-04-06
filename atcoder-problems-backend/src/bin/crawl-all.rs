use crawler::CrawlerClient;
use sea_orm::{Database, DatabaseConnection, EntityTrait, Set, sea_query::OnConflict};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();
    let db = setup_db().await?;
    let crawler = setup_crawler()?;

    let contests = sql_entities::contests::Entity::find().all(&db).await?;
    for contest in contests {
        tracing::info!("Fetching submissions for contest {}", contest.id);
        for page in 1.. {
            tracing::info!(
                "Fetching submissions for contest {} page {}",
                contest.id,
                page
            );
            let submissions = crawler.fetch_submissions(&contest.id, page).await?;
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
                    point: Set(submission.score.parse()?),
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
                    .await?;
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }

        tracing::info!("Finished fetching submissions for contest {}", contest.id);
    }

    Ok(())
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
