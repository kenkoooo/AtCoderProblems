use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::ProblemCrawler;
use atcoder_problems_backend::sql::connect;
use futures::executor::block_on;
use std::env;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    let db = connect(&url).unwrap();
    let crawler = ProblemCrawler::new(db, AtCoderClient::default());
    block_on(crawler.crawl()).unwrap();

    log::info!("Finished");
}
