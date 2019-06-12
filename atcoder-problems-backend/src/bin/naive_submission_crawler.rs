use atcoder_problems_backend::scraper;
use atcoder_problems_backend::sql::schema::*;
use atcoder_problems_backend::sql::simple_client::SimpleClient;
use atcoder_problems_backend::sql::SubmissionClient;
use chrono::{Duration, Utc};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::Connection;
use log::info;
use simple_logger;
use std::env;
use std::{thread, time};

const NEW_CONTEST_THRESHOLD_DAYS: i64 = 2;
const NEW_PAGE_THRESHOLD: usize = 5;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    loop {
        info!("Starting new loop...");
        let contests = conn.load_contests().expect("Failed to load contests");
        let now = Utc::now().timestamp();
        for contest in contests.into_iter().filter(|contest| {
            now - contest.start_epoch_second
                > Duration::days(NEW_CONTEST_THRESHOLD_DAYS).num_seconds()
        }) {
            for page in 1..=NEW_PAGE_THRESHOLD {
                info!("Crawling {} {}", contest.id, page);
                let new_submissions = scraper::scrape_submissions(&contest.id, Some(page))
                    .map(|(s, _)| s)
                    .unwrap_or_else(Vec::new);

                if new_submissions.is_empty() {
                    info!("There is no submission on {}-{}", contest.id, page);
                    break;
                }

                info!("Inserting {} submissions...", new_submissions.len());
                let min_id = new_submissions.iter().map(|s| s.id).min().unwrap();
                let exists = submissions::table
                    .select(submissions::id)
                    .filter(submissions::id.eq(min_id))
                    .load::<i64>(&conn)
                    .expect("Failed to load submissions")
                    .into_iter()
                    .next()
                    .is_some();
                conn.update_submissions(&new_submissions)
                    .expect("Failed to insert submissions");
                thread::sleep(time::Duration::from_millis(200));

                if exists {
                    break;
                }
            }
        }
    }
}
