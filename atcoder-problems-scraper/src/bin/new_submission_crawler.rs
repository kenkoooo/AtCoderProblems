use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use chrono::{Duration, Utc};
use diesel::pg::PgConnection;
use diesel::Connection;
use env_logger;
use log::{error, info};
use std::env;
use std::{thread, time};

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();
    info!("Started");

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    loop {
        info!("Starting new loop...");
        let mut contests = conn.get_contests().expect("Failed to load contests");
        let now = Utc::now().timestamp();

        contests.sort_by_key(|contest| -contest.start_epoch_second);
        for (_, contest) in contests.into_iter().enumerate().filter(|(i, contest)| {
            *i == 0 || now - contest.start_epoch_second < Duration::days(3).num_seconds()
        }) {
            info!("Starting for {}", contest.id);
            match scraper::get_max_submission_page(&contest.id) {
                Ok(max_page) => {
                    info!("There are {} pages on {}", max_page, contest.id);

                    for page in (1..=max_page).rev() {
                        info!("Crawling {} {}", contest.id, page);
                        let new_submissions = scraper::scrape_submissions(&contest.id, page);
                        conn.insert_submissions(&new_submissions)
                            .expect("Failed to insert submissions");
                        thread::sleep(time::Duration::from_millis(500));
                    }
                }
                Err(msg) => {
                    error!("Error to load the page list: {}", msg);
                }
            }
        }
    }
}
