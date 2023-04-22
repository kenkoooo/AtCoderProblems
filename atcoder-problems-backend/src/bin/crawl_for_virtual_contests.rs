use actix_web::rt::time;
use anyhow::Result;
use atcoder_client::AtCoderClient;
use atcoder_problems_backend::crawler::{FixCrawler, VirtualContestCrawler};
use atcoder_problems_backend::utils::init_log_config;
use chrono::Utc;
use rand::{thread_rng, Rng};
use sql_client::initialize_pool;
use std::{
    env,
    time::{Duration, Instant},
};

const FIX_RANGE_SECOND: i64 = 10 * 60;

async fn crawl<R: Rng>(url: &str, rng: &mut R, client: AtCoderClient) -> Result<()> {
    log::info!("Start crawling...");
    let pg_pool = initialize_pool(&url).await?;
    let mut crawler = VirtualContestCrawler::new(pg_pool.clone(), client.clone(), rng);
    crawler.crawl().await?;
    log::info!("Finished crawling");

    log::info!("Starting fixing...");
    let cur = Utc::now().timestamp();
    let crawler = FixCrawler::new(pg_pool, client.clone(), cur - FIX_RANGE_SECOND);
    crawler.crawl().await?;
    log::info!("Finished fixing");

    Ok(())
}

#[actix_web::main]
async fn main() {
    init_log_config().unwrap();
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let username = env::var("ATCODER_USERNAME").expect("ATCODER_USERNAME is not set.");
    let password = env::var("ATCODER_PASSWORD").expect("ATCODER_PASSWORD is not set.");
    log::info!("Started");

    let mut rng = thread_rng();

    loop {
        log::info!("Start new loop...");
        let now = Instant::now();

        match AtCoderClient::new(&username, &password).await {
            Ok(client) => {
                if let Err(e) = crawl(&url, &mut rng, client).await {
                    log::error!("{:?}", e);
                }
            }
            Err(e) => {
                log::error!("{:?}", e);
            }
        }

        let elapsed_secs = now.elapsed().as_secs();
        log::info!("Elapsed {} sec.", elapsed_secs);
        if elapsed_secs < 10 {
            let sleep_seconds = 10 - elapsed_secs;
            log::info!("Sleeping {} sec.", sleep_seconds);
            time::sleep(Duration::from_secs(sleep_seconds)).await;
        }

        log::info!("Finished a loop");
    }
}
