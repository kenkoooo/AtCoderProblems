use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::ProblemCrawler;
use std::env;

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    let pg_pool = sql_client::initialize_pool(&url).await.unwrap();
    let crawler = ProblemCrawler::new(pg_pool, AtCoderClient::default());
    crawler.crawl().await.expect("Failed to crawl");

    log::info!("Finished");
}
