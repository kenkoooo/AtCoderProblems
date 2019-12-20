use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::{FixCrawler, VirtualContestCrawler};
use chrono::Utc;
use diesel::{Connection, PgConnection};
use std::error::Error;
use std::time::{Duration, Instant};
use std::{env, thread};

const FIX_RANGE_SECOND: i64 = 10 * 60;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    log::info!("Started");

    loop {
        log::info!("Start new loop...");
        let now = Instant::now();

        log::info!("Start crawling...");
        let url = env::var("SQL_URL")?;
        let conn = PgConnection::establish(&url)?;
        let crawler = VirtualContestCrawler::new(conn, AtCoderClient::default());
        crawler.crawl()?;
        log::info!("Finished crawling");

        log::info!("Starting fixing...");
        let conn = PgConnection::establish(&url)?;
        let cur = Utc::now().timestamp();
        let crawler = FixCrawler::new(conn, AtCoderClient::default(), cur - FIX_RANGE_SECOND);
        crawler.crawl()?;
        log::info!("Finished fixing");

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
