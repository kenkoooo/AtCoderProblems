use atcoder_problems_backend::scraper;
use atcoder_problems_backend::sql::client::SqlClient;
use atcoder_problems_backend::sql::SubmissionClient;
use diesel::pg::PgConnection;
use diesel::Connection;
use log::{error, info};
use simple_logger;
use std::env;
use std::{thread, time};

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    loop {
        info!("Starting new loop...");
        let contests = conn.get_contests().expect("Failed to load contests");
        for contest in contests.into_iter() {
            info!("Starting for {}", contest.id);
            match scraper::scrape_submissions(&contest.id, None) {
                Some((_, max_page)) => {
                    info!("There are {} pages on {}", max_page, contest.id);

                    for page in (1..=max_page).rev() {
                        info!("Crawling {} {}", contest.id, page);
                        let new_submissions = scraper::scrape_submissions(&contest.id, Some(page))
                            .map(|(s, _)| s)
                            .unwrap_or_else(Vec::new);
                        info!("Inserting {} submissions", new_submissions.len());
                        conn.update_submissions(&new_submissions)
                            .expect("Failed to insert submissions");
                        thread::sleep(time::Duration::from_millis(200));
                    }
                }
                None => {
                    error!("Error!");
                }
            }
        }
    }
}
