use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use chrono::{Duration, Utc};
use diesel::pg::PgConnection;
use env_logger;
use log::info;
use r2d2;
use r2d2_diesel::ConnectionManager;
use std::env;
use std::{thread, time};

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let manager = ConnectionManager::<PgConnection>::new(url.as_str());
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.");
    let all_submission_crawler = {
        let pool = pool.clone();
        thread::spawn(move || loop {
            let conn = pool.get().expect("Failed to get a connection.");
            let contests = conn.get_contests().unwrap();
            for contest in contests.iter() {
                let max_page = scraper::get_max_submission_page(&contest.id).unwrap();
                for page in (1..=max_page).rev() {
                    info!("all submission crawling: {} {}", contest.id, page);
                    let submissions = scraper::scrape_submissions(&contest.id, page);
                    conn.insert_submissions(&submissions).unwrap();
                    thread::sleep(time::Duration::from_millis(500));
                }
            }
        })
    };

    let new_submission_crawler = {
        let pool = pool.clone();
        thread::spawn(move || loop {
            let conn = pool.get().expect("Failed to get a connection.");
            let contests = conn.get_contests().unwrap();
            for contest in contests.iter() {
                for page in 1..=2 {
                    info!("new submission crawling: {} {}", contest.id, page);
                    let submissions = scraper::scrape_submissions(&contest.id, page);
                    conn.insert_submissions(&submissions).unwrap();
                    thread::sleep(time::Duration::from_millis(500));
                }
            }
        })
    };

    let recent_submission_crawler = thread::spawn(move || loop {
        let conn = pool.get().expect("Failed to get a connection.");
        let now = Utc::now().timestamp();
        let contests = conn
            .get_contests()
            .unwrap()
            .into_iter()
            .filter(|contest| now - contest.start_epoch_second < Duration::days(7).num_seconds())
            .collect::<Vec<_>>();
        if contests.is_empty() {
            thread::sleep(time::Duration::from_secs(3600));
        } else {
            for contest in contests.iter() {
                let max_page = scraper::get_max_submission_page(&contest.id).unwrap();
                for page in (1..=max_page).rev() {
                    info!("recent submission crawling: {} {}", contest.id, page);
                    let submissions = scraper::scrape_submissions(&contest.id, page);
                    conn.insert_submissions(&submissions).unwrap();
                    thread::sleep(time::Duration::from_millis(500));
                }
            }
        }
    });

    all_submission_crawler.join().unwrap();
    new_submission_crawler.join().unwrap();
    recent_submission_crawler.join().unwrap();
}
