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

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;

    let revel_session = std::env::var("REVEL_SESSION").expect("REVEL_SESSION must be set");
    let crawler = CrawlerClient::new(revel_session)?;

    // Get all contest IDs and contest IDs that already have problems
    let all_contest_ids = crawler_utils::get_all_contest_ids(&db).await?;
    let contest_ids_with_problems = crawler_utils::get_contest_ids_with_problems(&db).await?;

    // Find contests without problems
    let contests_without_problems =
        crawler_utils::find_contests_without_problems(all_contest_ids, contest_ids_with_problems);

    tracing::info!(
        "Found {} contests without problems",
        contests_without_problems.len()
    );

    for contest_id in contests_without_problems {
        tracing::info!("Fetching problems for contest {}", contest_id);

        let problems = crawler_utils::fetch_problems(&crawler, &contest_id).await;

        if problems.is_empty() {
            tracing::warn!("No problems found for contest {}", contest_id);
            continue;
        }

        tracing::info!(
            "Inserting {} problems for contest {}",
            problems.len(),
            contest_id
        );

        let inserted = crawler_utils::upsert_problems(&db, problems).await?;
        tracing::info!("Inserted {} problems for contest {}", inserted, contest_id);

        // Rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    tracing::info!("Finished crawling problems");

    Ok(())
}
