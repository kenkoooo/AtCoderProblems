extern crate openssl;

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
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
    let scraper = scraper::Scraper;

    let args: Vec<_> = env::args().collect();
    match args[1].as_str() {
        "naive" => {
            crawler::crawl_from_new_contests(&conn, &scraper)?;
        }
        "new" => {
            crawler::crawl_new_submissions(&conn, &scraper)?;
        }
        "all" => {
            crawler::crawl_all_submissions(&conn, &scraper)?;
        }
        "contest" => {
            crawler::crawl_contest_and_problems(&conn, &scraper)?;
        }
        _ => {
            unimplemented!("Unsupported: {}", args[0]);
        }
    }
    Ok(())
}
