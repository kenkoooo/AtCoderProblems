use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use chrono::{Duration, Utc};
use diesel::pg::PgConnection;
use diesel::Connection;
use env_logger;
use log::info;
use std::env;

enum Runner {
    AllSubmissions,
    RecentContests,
    NewSubmissions,
}
struct State {
    page: usize,
    contests: Vec<String>,
    runner: Runner,
}

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    let mut states = [
        State {
            page: 0,
            contests: vec![],
            runner: Runner::AllSubmissions,
        },
        State {
            page: 0,
            contests: vec![],
            runner: Runner::RecentContests,
        },
        State {
            page: 0,
            contests: vec![],
            runner: Runner::NewSubmissions,
        },
    ];

    loop {
        for state in states.iter_mut() {
            if state.page > 0 {
                assert!(state.contests.len() > 0);
                let page = state.page;
                let contest_id = state.contests[0].clone();
                info!("crawling: {} {}", contest_id, page);
                let submissions = scraper::scrape_submissions(&contest_id, page);
                conn.insert_submissions(&submissions).unwrap();
                state.page -= 1;
                if state.page == 0 {
                    state.contests.remove(0);
                }
            } else if state.contests.len() > 0 {
                let contest_id = state.contests[0].clone();
                match state.runner {
                    Runner::AllSubmissions | Runner::RecentContests => {
                        // all | recent
                        let max_page = scraper::get_max_submission_page(&contest_id)
                            .expect("Failed to scrape page list");
                        state.page = max_page;
                    }
                    Runner::NewSubmissions => {
                        state.page = 2;
                    }
                }
            } else {
                assert_eq!(state.page, 0);
                assert!(state.contests.is_empty());
                match state.runner {
                    Runner::AllSubmissions | Runner::NewSubmissions => {
                        // all | new
                        state.contests = conn
                            .get_contests()
                            .expect("Failed to get contests")
                            .into_iter()
                            .map(|c| c.id)
                            .collect();
                    }
                    Runner::RecentContests => {
                        let now = Utc::now().timestamp();
                        state.contests = conn
                            .get_contests()
                            .expect("Failed to load contests")
                            .into_iter()
                            .filter(|contest| {
                                now - contest.start_epoch_second < Duration::days(7).num_seconds()
                            })
                            .map(|c| c.id)
                            .collect::<Vec<_>>();
                    }
                }
            }
        }
    }
}
