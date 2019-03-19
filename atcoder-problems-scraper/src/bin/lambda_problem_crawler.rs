#[macro_use]
extern crate lambda_runtime as lambda;

use lambda::error::HandlerError;
use log::info;
use serde_json;
use serde_json::Value;

use std::collections::HashSet;
use std::env;
use std::error::Error;

use atcoder_problems_scraper::scraper;
use atcoder_problems_scraper::sql::SqlClient;

fn main() -> Result<(), Box<dyn Error>> {
    lambda!(my_handler);

    Ok(())
}

fn my_handler(_: Value, c: lambda::Context) -> Result<String, HandlerError> {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let user = env::var("SQL_USER").unwrap();
    let pass = env::var("SQL_PASS").unwrap();
    let host = env::var("SQL_HOST").unwrap();
    let conn = SqlClient::new(&user, &pass, &host, "atcoder");

    info!("Crawling contests...");
    conn.insert_contests(&scraper::scrape_all_contests())
        .map_err(|e| c.new_error(&e))?;

    let crawled_contest_ids = conn
        .get_problems()
        .map_err(|e| c.new_error(&e))?
        .into_iter()
        .map(|problem| problem.contest_id)
        .collect::<HashSet<_>>();
    for contest in conn
        .get_contests()
        .map_err(|e| c.new_error(&e))?
        .into_iter()
        .filter(|contest| !crawled_contest_ids.contains(&contest.id))
    {
        info!("Crawling problems in {}...", contest.id);

        let problems = scraper::scrape_problems(&contest.id).map_err(|e| c.new_error(&e))?;
        conn.insert_problems(&problems)
            .map_err(|e| c.new_error(&e))?;
    }
    Ok("finished".to_owned())
}
