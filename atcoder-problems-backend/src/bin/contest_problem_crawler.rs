use atcoder_problems_backend::scraper;
use atcoder_problems_backend::sql::models::ContestProblem;
use atcoder_problems_backend::sql::schema::*;
use atcoder_problems_backend::sql::simple_client::SimpleClient;
use atcoder_problems_backend::sql::ContestProblemClient;
use atcoder_problems_backend::utils;
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
                let contest_problem = problems
                    .iter()
                    .map(|problem| ContestProblem {
                        problem_id: problem.id.clone(),
                        contest_id: problem.contest_id.clone(),
                    })
                    .collect::<Vec<_>>();
                conn.insert_contest_problem(&contest_problem)
                    .expect("Failed to insert contest-problem pairs");
            }
            None => error!("Failed to crawl contests!"),
        }

        thread::sleep(time::Duration::from_millis(500));
    }

    let performances = conn
        .load_performances()
        .expect("Failed to load performances.");
    let contests = utils::extract_non_performance_contests(&contests, &performances);
    for contest in contests.into_iter() {
        info!("Crawling results of {}", contest.id);
        let performances = scraper::get_performances(&contest.id).unwrap();

        info!("Inserting results of {}", contest.id);
        conn.insert_performances(&performances).unwrap();

        info!("Sleeping...");
        thread::sleep(time::Duration::from_millis(500));
    }
}
