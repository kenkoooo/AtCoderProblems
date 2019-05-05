use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use env_logger;
use log::{error, info};
use std::env;
use std::{thread, time};

use atcoder_problems_sql_common::schema::*;

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).unwrap();

    info!("Starting...");
    let contests: Vec<_> = (1..)
        .map(|page| {
            info!("crawling contest page-{}", page);
            match scraper::scrape_contests(page) {
                Ok(contests) => {
                    thread::sleep(time::Duration::from_secs(1));
                    contests
                }
                Err(_) => Vec::new(),
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
        info!("Crawling problems of {},,,", contest);
        match scraper::scrape_problems(&contest) {
            Ok(problems) => {
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
            Err(e) => error!("{}", e),
        }

        thread::sleep(time::Duration::from_millis(500));
    }
}
