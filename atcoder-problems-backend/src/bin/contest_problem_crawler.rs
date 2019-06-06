use atcoder_problems_backend::scraper;
use atcoder_problems_backend::sql::client::SqlClient;
use atcoder_problems_backend::sql::schema::*;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use log::{error, info};
use simple_logger;
use std::env;
use std::{thread, time};

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).unwrap();

    info!("Starting...");
    let contests: Vec<_> = (1..)
        .map(|page| {
            info!("crawling contest page-{}", page);
            match scraper::scrape_contests(page) {
                Some(contests) => {
                    thread::sleep(time::Duration::from_secs(1));
                    contests
                }
                None => Vec::new(),
            }
        })
        .take_while(|contests| !contests.is_empty())
        .flatten()
        .collect();

    info!("There are {} contests.", contests.len());
    conn.insert_contests(&contests).unwrap();

    let no_problem_contests = contests::table
        .left_join(contest_problem::table.on(contests::id.eq(contest_problem::contest_id)))
        .left_join(problems::table.on(contest_problem::problem_id.eq(problems::id)))
        .filter(problems::id.is_null())
        .select(contests::id)
        .load::<String>(&conn)
        .expect("Invalid contest extraction query");

    for contest in no_problem_contests.into_iter() {
        info!("Crawling problems of {}...", contest);
        match scraper::scrape_problems(&contest) {
            Some(problems) => {
                info!("Inserting {} problems...", problems.len());
                conn.insert_problems(&problems)
                    .expect("Failed to insert problems");
                conn.insert_contest_problem_pair(
                    &problems
                        .iter()
                        .map(|problem| (problem.contest_id.as_str(), problem.id.as_str()))
                        .collect::<Vec<_>>(),
                )
                .expect("Failed to insert contest-problem pairs");
            }
            None => error!("Failed to crawl contests!"),
        }

        thread::sleep(time::Duration::from_millis(500));
    }

    let contests_without_performances = conn
        .get_contests_without_performances()
        .expect("Invalid query.");
    for contest in contests_without_performances.into_iter() {
        info!("Crawling results of {}", contest);
        let performances = scraper::get_performances(&contest).unwrap();

        info!("Inserting results of {}", contest);
        conn.insert_performances(&performances).unwrap();

        info!("Sleeping...");
        thread::sleep(time::Duration::from_millis(500));
    }
}
