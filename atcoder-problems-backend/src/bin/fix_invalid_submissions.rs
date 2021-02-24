use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::FixCrawler;
use chrono::Utc;
use log::info;
use sql_client::initialize_pool;
use std::env;

const ONE_DAY: i64 = 24 * 3600;

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let db = initialize_pool(&url).await.unwrap();
    let now = Utc::now().timestamp();
    let crawler = FixCrawler::new(db, AtCoderClient::default(), now - ONE_DAY);
    crawler.crawl().await.expect("Failed to crawl");
    info!("Finished fixing.");
}
