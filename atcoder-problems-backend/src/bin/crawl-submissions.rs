use std::str::FromStr;

use atcoder_problems_backend::crawler_utils;
use crawler::{CrawlerClient, CrawlerError};
use sea_orm::{
    ColumnTrait, Database, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, QuerySelect,
};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();
    let args: Vec<String> = std::env::args().collect();
    let mode = Mode::from_str(&args[1]).expect("Invalid mode");

    let db = setup_db().await.expect("Failed to connect to database");
    let crawler = setup_crawler().expect("Failed to create crawler");

    let contests = match mode {
        Mode::All | Mode::New => sql_entities::contests::Entity::find()
            .all(&db)
            .await
            .expect("Failed to load contests"),
        Mode::Recent => {
            let current_time = chrono::Utc::now().timestamp();
            sql_entities::contests::Entity::find()
                .filter(sql_entities::contests::Column::StartEpochSecond.lt(current_time))
                .order_by_desc(sql_entities::contests::Column::StartEpochSecond)
                .limit(5)
                .all(&db)
                .await
                .expect("Failed to load contests")
        }
    };

    for contest in contests {
        tracing::info!("Fetching submissions for contest {}", contest.id);
        for page in 1.. {
            tracing::info!(
                "Fetching submissions for contest {} page {}",
                contest.id,
                page
            );
            let submissions = crawler_utils::fetch_submissions(&crawler, &contest.id, page).await;
            if submissions.is_empty() {
                tracing::info!("No more submissions for contest {}", contest.id);
                break;
            }

            tracing::info!("Inserting {} submissions", submissions.len());
            let inserted = crawler_utils::upsert_submissions(&db, submissions)
                .await
                .expect("Failed to insert submissions");
            tracing::info!("Inserted {} submissions", inserted);
            if inserted == 0 && mode == Mode::New {
                tracing::info!("No new submissions for contest {}", contest.id);
                break;
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }

        tracing::info!("Finished fetching submissions for contest {}", contest.id);
    }
}

async fn setup_db() -> Result<DatabaseConnection, sea_orm::DbErr> {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;
    Ok(db)
}

fn setup_crawler() -> Result<CrawlerClient, CrawlerError> {
    let revel_session = std::env::var("REVEL_SESSION").expect("REVEL_SESSION must be set");
    let crawler = CrawlerClient::new(revel_session)?;
    Ok(crawler)
}

#[derive(Debug, PartialEq, Eq)]
enum Mode {
    All,
    Recent,
    New,
}

impl FromStr for Mode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "all" => Ok(Mode::All),
            "recent" => Ok(Mode::Recent),
            "new" => Ok(Mode::New),
            _ => Err("Invalid mode".to_string()),
        }
    }
}
