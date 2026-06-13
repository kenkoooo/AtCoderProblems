use atcoder_problems_backend::crawler_utils;
use crawler::CrawlerClient;
use sea_orm::Database;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let database_url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL must be set")?;
    let db = Database::connect(&database_url).await?;

    let revel_session = std::env::var("REVEL_SESSION").map_err(|_| "REVEL_SESSION must be set")?;
    let crawler = CrawlerClient::new(revel_session)?;

    crawler_utils::crawl_problems(&crawler, &db).await?;

    Ok(())
}
