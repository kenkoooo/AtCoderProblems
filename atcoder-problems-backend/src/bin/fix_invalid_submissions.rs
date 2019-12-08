use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::fix_crawler::FixCrawler;
use chrono::Utc;
use diesel::{Connection, PgConnection};
use log::info;
use std::env;

const ONE_DAY: i64 = 24 * 3600;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
    let now = Utc::now().timestamp();
    let crawler = FixCrawler::new(conn, AtCoderClient::default(), now - ONE_DAY);
    crawler.crawl().expect("Failed to crawl");
    info!("Finished fixing.");
}
