use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::ProblemCrawler;
use atcoder_problems_backend::sql::connect;
use std::env;

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    let db = connect(&url).unwrap();
    let crawler = ProblemCrawler::new(db, AtCoderClient::default());
    crawler.crawl().await.expect("Failed to crawl");

    log::info!("Finished");
}
