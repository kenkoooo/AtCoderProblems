use algorithm_problem_client::AtCoderClient;
use anyhow::Result;
use atcoder_problems_backend::crawler::RecentCrawler;
use std::{env, thread, time};

async fn crawl(url: &str) -> Result<()> {
    let db = sql_client::initialize_pool(url).await?;
    let crawler = RecentCrawler::new(db, AtCoderClient::default());
    crawler.crawl().await
}

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");

    loop {
        log::info!("Start new loop");
        if let Err(e) = crawl(&url).await {
            log::error!("{:?}", e);
            thread::sleep(time::Duration::from_millis(1000));
        }
    }
}
