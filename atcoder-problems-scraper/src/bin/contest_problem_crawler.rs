use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;
use env_logger;
use log::{error, info};
use std::collections::HashSet;
use std::env;
use std::{thread, time};

fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let user = env::var("SQL_USER").unwrap();
    let pass = env::var("SQL_PASS").unwrap();
    let host = env::var("SQL_HOST").unwrap();
    let conn = SqlClient::new(&user, &pass, &host, "atcoder");

    loop {
        info!("Starting...");

        let contests = scraper::scrape_all_contests();
        info!("There are {} contests.", contests.len());
        conn.insert_contests(&contests).unwrap();

        let crawled_contest_ids = conn
            .get_problems()
            .unwrap()
            .into_iter()
            .map(|problem| problem.contest_id)
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
                    conn.insert_problems(&problems).unwrap();
                }
                Err(e) => error!("{}", e),
            }

            thread::sleep(time::Duration::from_secs(5));
        }

        info!("Suspending...");
        thread::sleep(time::Duration::from_secs(3600));
    }
}
