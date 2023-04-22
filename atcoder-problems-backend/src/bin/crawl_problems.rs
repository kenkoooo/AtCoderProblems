use atcoder_client::AtCoderClient;
use atcoder_problems_backend::crawler::ProblemCrawler;
use atcoder_problems_backend::utils::init_log_config;
use sql_client::initialize_pool;
use std::env;

#[actix_web::main]
async fn main() {
    init_log_config().unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let username = env::var("ATCODER_USERNAME").expect("ATCODER_USERNAME is not set.");
    let password = env::var("ATCODER_PASSWORD").expect("ATCODER_PASSWORD is not set.");

    let db = initialize_pool(&url).await.unwrap();
    let client = AtCoderClient::new(&username, &password)
        .await
        .expect("AtCoder authentication failure");
    let crawler = ProblemCrawler::new(db, client);
    crawler.crawl().await.expect("Failed to crawl");

    log::info!("Finished");
}
