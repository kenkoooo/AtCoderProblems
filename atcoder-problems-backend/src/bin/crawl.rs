extern crate openssl;

use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::{crawler, scraper};
use diesel::pg::PgConnection;
use diesel::Connection;
use log::info;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let args: Vec<_> = env::args().collect();
    let scraper = scraper::Scraper;
    let client = AtCoderClient::default();
    match args[1].as_str() {
        "naive" => loop {
            let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
            crawler::crawl_from_new_contests(&conn, &client)?;
        },
        "new" => loop {
            let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
            crawler::crawl_new_submissions(&conn, &client)?;
        },
        "all" => loop {
            let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
            crawler::crawl_all_submissions(&conn, &client)?;
        },
        "contest" => {
            let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
            crawler::crawl_contest_and_problems(&conn, &scraper, &client)?;
        }
        _ => {
            unimplemented!("Unsupported: {}", args[0]);
        }
    }
    Ok(())
}
