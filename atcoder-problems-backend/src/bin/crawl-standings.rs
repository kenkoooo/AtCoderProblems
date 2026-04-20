use std::path::PathBuf;

use crawler::CrawlerClient;
use s3::S3Client;
use sea_orm::{Database, DatabaseConnection, EntityTrait};
use serde_json::Value;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let db = setup_db().await?;
    let crawler = setup_crawler()?;
    let s3 = setup_s3().await?;

    let contests = sql_entities::contests::Entity::find().all(&db).await?;

    for contest in contests {
        tracing::info!("Fetching standings for contest: {}", contest.id);
        let key = standings_key(&contest)?;
        let exisiting = s3.get_object(&key).await?;
        if exisiting.is_some() {
            tracing::info!("Standings for contest {} already exists", contest.id);
            continue;
        }
        let standings = match fetch_standings_with_retry(&crawler, &contest.id).await {
            Some(standings) => standings,
            None => {
                continue;
            }
        };

        let fixed = standings["Fixed"].as_bool().unwrap_or(false);
        if !fixed {
            tracing::warn!("Standings for contest {} is not fixed", contest.id);
            continue;
        }

        let json = serde_json::to_vec(&standings)?;
        s3.put_object(&key, json).await?;

        // Rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }
    Ok(())
}

fn standings_key(contest: &sql_entities::contests::Model) -> Result<String> {
    let path = PathBuf::from("standings")
        .join(&contest.id)
        .with_extension("json");
    path.to_str()
        .map(str::to_string)
        .ok_or_else(|| format!("Failed to convert path to str: {}", path.display()).into())
}

async fn fetch_standings_with_retry(crawler: &CrawlerClient, contest_id: &str) -> Option<Value> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match crawler.fetch_standings(contest_id).await {
            Ok(Some(standings)) => return Some(standings),
            Ok(None) => {
                tracing::warn!("Standings for contest {} not found", contest_id);
                return None;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch standings for {} (attempt {}/{}): {}",
                    contest_id,
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!(
        "Failed to fetch standings for {} after {} retries, skipping",
        contest_id,
        MAX_RETRIES
    );
    None
}

async fn setup_db() -> Result<DatabaseConnection> {
    let database_url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL must be set")?;
    let db = Database::connect(&database_url).await?;
    Ok(db)
}

fn setup_crawler() -> Result<CrawlerClient> {
    let revel_session = std::env::var("REVEL_SESSION").map_err(|_| "REVEL_SESSION must be set")?;
    let crawler = CrawlerClient::new(revel_session)?;
    Ok(crawler)
}

async fn setup_s3() -> Result<S3Client> {
    let bucket_name = std::env::var("S3_BUCKET_NAME").map_err(|_| "S3_BUCKET_NAME must be set")?;
    Ok(S3Client::new(&bucket_name).await)
}
