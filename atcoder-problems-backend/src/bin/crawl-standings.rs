use std::path::PathBuf;

use crawler::{CrawlerClient, CrawlerError};
use s3::S3Client;
use sea_orm::{Database, DatabaseConnection, EntityTrait};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let db = setup_db().await.expect("Failed to connect to database");
    let crawler = setup_crawler().expect("Failed to create crawler");
    let s3 = setup_s3().await;

    let contests = sql_entities::contests::Entity::find()
        .all(&db)
        .await
        .expect("Failed to load contests");

    let key = |contest: &sql_entities::contests::Model| {
        let key = PathBuf::from("standings")
            .join(&contest.id)
            .with_extension("json");
        key.to_str()
            .expect(format!("Failed to convert path to str: {}", key.display()).as_str())
            .to_string()
    };

    for contest in contests {
        tracing::info!("Fetching standings for contest: {}", contest.id);
        let key = key(&contest);
        let exisiting = s3.get_object(&key).await.expect("Failed to get object");
        if exisiting.is_some() {
            tracing::info!("Standings for contest {} already exists", contest.id);
            continue;
        }
        let standings = crawler
            .fetch_standings(&contest.id)
            .await
            .expect("Failed to fetch standings");
        let json = serde_json::to_vec(&standings).expect("Failed to serialize standings");
        s3.put_object(&key, json)
            .await
            .expect("Failed to put object");
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

async fn setup_s3() -> S3Client {
    let bucket_name = std::env::var("S3_BUCKET_NAME").expect("S3_BUCKET_NAME must be set");
    let s3 = S3Client::new(&bucket_name).await;
    s3
}
