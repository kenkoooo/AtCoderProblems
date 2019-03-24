use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use diesel::pg::PgConnection;
use diesel::Connection;
use env_logger;
use log::info;
use std::env;

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();
    info!("Started");

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    loop {
        info!("Starting new loop...");
        let contests = conn.get_contests().expect("Failed to load contests");
        for contest in contests.into_iter() {
            info!("Starting for {}", contest.id);
            let max_page =
                scraper::get_max_submission_page(&contest.id).expect("Failed to scrape page list");
            info!("There are {} pages on {}", max_page, contest.id);

            for page in (1..=max_page).rev() {
                info!("Crawling {} {}", contest.id, page);
                let new_submissions = scraper::scrape_submissions(&contest.id, page);
                conn.insert_submissions(&new_submissions)
                    .expect("Failed to insert submissions");
            }
        }
    }
}
