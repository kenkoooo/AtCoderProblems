use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use env_logger;
use log::{error, info};
use std::collections::HashSet;
use std::env;
use std::{thread, time};

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).unwrap();

    loop {
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

        let crawled_problems = conn.get_problems().expect("Failed to load problems.");
        conn.insert_contest_problem_pair(
            &crawled_problems
                .iter()
                .map(|problem| (problem.contest_id.as_str(), problem.id.as_str()))
                .collect::<Vec<_>>(),
        )
        .expect("Failed to insert contest-problem pairs");

        let crawled_contest_ids = crawled_problems
            .iter()
            .map(|problem| problem.contest_id.clone())
            .collect::<HashSet<_>>();
        info!("There are {} crawled contests.", crawled_contest_ids.len());

        let uncrawled_contest_ids = contests
            .into_iter()
            .filter(|contest| !crawled_contest_ids.contains(&contest.id))
            .map(|contest| contest.id)
            .collect::<Vec<_>>();
        info!(
            "There are {} uncrawled contests.",
            uncrawled_contest_ids.len()
        );

        for contest_id in uncrawled_contest_ids.into_iter() {
            info!("Crawling problems of {},,,", contest_id);
            match scraper::scrape_problems(&contest_id) {
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

            thread::sleep(time::Duration::from_secs(5));
        }

        info!("Suspending...");
        thread::sleep(time::Duration::from_secs(3600));
    }
}
