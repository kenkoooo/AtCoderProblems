use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::recent_crawler::RecentCrawler;
use diesel::{Connection, PgConnection};
use log::{error, info};
use std::env;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");

    loop {
        match PgConnection::establish(&url) {
            Ok(conn) => {
                let crawler = RecentCrawler::new(conn, AtCoderClient::default());
                match crawler.crawl() {
                    Ok(_) => {}
                    Err(e) => {
                        error!("Failed to crawl submissions: {:?}", e);
                    }
                }
            }
            Err(e) => {
                error!("Failed to connect to PostgreSQL {:?}", e);
            }
        }
    }
}
