use actix_web::rt::time;
use anyhow::Result;
use atcoder_client::AtCoderClient;
use atcoder_problems_backend::crawler::RecentCrawler;
use atcoder_problems_backend::utils::init_log_config;
use sql_client::initialize_pool;
use std::{env, time::Duration};

async fn crawl(url: &str) -> Result<()> {
    let db = initialize_pool(url).await?;
    let crawler = RecentCrawler::new(db, AtCoderClient::default());
    crawler.crawl().await
}

#[actix_web::main]
async fn main() {
    init_log_config().unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");

    loop {
        log::info!("Start new loop");
        if let Err(e) = crawl(&url).await {
            log::error!("{:?}", e);
            time::sleep(Duration::from_secs(1)).await;
        }
    }
}
