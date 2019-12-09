use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::whole_contest_crawler::WholeContestCrawler;
use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::sql::connect;
use log::info;
use std::env;

fn main() -> Result<()> {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let contest_id = env::args()
        .collect::<Vec<String>>()
        .get(1)
        .cloned()
        .expect("contest_id is not set.");
    let db = connect(&url)?;
    let crawler = WholeContestCrawler::new(db, AtCoderClient::default(), contest_id);
    crawler.crawl()?;
    Ok(())
}
