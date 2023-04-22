use atcoder_client::AtCoderClient;
use atcoder_problems_backend::crawler::FixCrawler;
use atcoder_problems_backend::utils::init_log_config;
use chrono::Utc;
use log::info;
use sql_client::initialize_pool;
use std::env;

const ONE_DAY: i64 = 24 * 3600;

#[actix_web::main]
async fn main() {
    init_log_config().unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let username = env::var("ATCODER_USERNAME").expect("ATCODER_USERNAME is not set.");
    let password = env::var("ATCODER_PASSWORD").expect("ATCODER_PASSWORD is not set.");

    let db = initialize_pool(&url).await.unwrap();
    let now = Utc::now().timestamp();
    let client = AtCoderClient::new(&username, &password)
        .await
        .expect("AtCoder authentication failure");
    let crawler = FixCrawler::new(db, client, now - ONE_DAY);
    crawler.crawl().await.expect("Failed to crawl");
    info!("Finished fixing.");
}
