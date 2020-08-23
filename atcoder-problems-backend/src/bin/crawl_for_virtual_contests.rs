use algorithm_problem_client::AtCoderClient;
use anyhow::Result;
use atcoder_problems_backend::crawler::{FixCrawler, VirtualContestCrawler};
use atcoder_problems_backend::sql::connect;
use chrono::Utc;
use rand::{thread_rng, Rng};
use sql_client::initialize_pool;
use std::time::{Duration, Instant};
use std::{env, thread};

const FIX_RANGE_SECOND: i64 = 10 * 60;

async fn crawl<R: Rng>(url: &str, rng: &mut R) -> Result<()> {
    log::info!("Start crawling...");
    let conn = connect(&url)?;
    let pg_pool = initialize_pool(&url).await?;
    let mut crawler = VirtualContestCrawler::new(conn, pg_pool, AtCoderClient::default(), rng);
    crawler.crawl().await?;
    log::info!("Finished crawling");

    log::info!("Starting fixing...");
    let conn = connect(&url)?;
    let cur = Utc::now().timestamp();
    let crawler = FixCrawler::new(conn, AtCoderClient::default(), cur - FIX_RANGE_SECOND);
    crawler.crawl().await?;
    log::info!("Finished fixing");

    Ok(())
}

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).expect("Failed to initialize the logger.");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    log::info!("Started");

    let mut rng = thread_rng();

    loop {
        log::info!("Start new loop...");
        let now = Instant::now();

        if let Err(e) = crawl(&url, &mut rng).await {
            log::error!("{:?}", e);
        }

        let elapsed_secs = now.elapsed().as_secs();
        log::info!("Elapsed {} sec.", elapsed_secs);
        if elapsed_secs < 10 {
            let sleep_seconds = 10 - elapsed_secs;
            log::info!("Sleeping {} sec.", sleep_seconds);
            thread::sleep(Duration::from_secs(sleep_seconds));
        }

        log::info!("Finished a loop");
    }
}
