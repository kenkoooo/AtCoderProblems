use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use chrono::{Duration, Utc};
use env_logger;
use log::info;
use std::env;
use std::sync::Arc;
use std::{thread, time};

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let user = env::var("SQL_USER").unwrap();
    let pass = env::var("SQL_PASS").unwrap();
    let host = env::var("SQL_HOST").unwrap();
    let conn = SqlClient::new(&user, &pass, &host, "atcoder");
    let conn = Arc::new(conn);

    let conn1 = conn.clone();
    let all_submission_crawler = thread::spawn(move || {
        let conn = conn1;
        loop {
            let contests = conn.get_contests().unwrap();
            for contest in contests.iter() {
                let max_page = scraper::get_max_submission_page(&contest.id).unwrap();
                for page in (1..=max_page).rev() {
                    info!("all submission crawling: {} {}", contest.id, page);
                    let submissions = scraper::scrape_submissions(&contest.id, page).unwrap();
                    conn.insert_submissions(&submissions).unwrap();
                    thread::sleep(time::Duration::from_millis(500));
                }
            }
        }
    });

    let conn1 = conn.clone();
    let new_submission_crawler = thread::spawn(move || {
        let conn = conn1;
        loop {
            let contests = conn.get_contests().unwrap();
            for contest in contests.iter() {
                for page in 1..=2 {
                    info!("new submission crawling: {} {}", contest.id, page);
                    let submissions = scraper::scrape_submissions(&contest.id, page).unwrap();
                    conn.insert_submissions(&submissions).unwrap();
                    thread::sleep(time::Duration::from_millis(500));
                }
            }
        }
    });

    let recent_submission_crawler = thread::spawn(move || loop {
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
                    let submissions = scraper::scrape_submissions(&contest.id, page).unwrap();
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
