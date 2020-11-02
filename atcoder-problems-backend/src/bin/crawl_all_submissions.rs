use algorithm_problem_client::AtCoderClient;
use anyhow::Result;
use atcoder_problems_backend::crawler::WholeContestCrawler;
use log::{error, info};
use sql_client::initialize_pool;
use sql_client::models::Contest;
use sql_client::simple_client::SimpleClient;
use std::{env, thread, time};

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    loop {
        info!("Start new loop");

        match load_contest(&url).await {
            Ok(contests) => {
                for contest in contests.into_iter() {
                    finish_one_contest(&url, &contest.id).await;
                }
            }
            Err(e) => {
                error!("Failed to load the contests: {:?}", e);
                sleep_1sec();
            }
        }
    }
}

async fn finish_one_contest(url: &str, contest_id: &str) {
    loop {
        info!("Starting {}", contest_id);
        match crawl_one_contest(url, contest_id).await {
            Ok(_) => {
                info!("Finished {}", contest_id);
                return;
            }
            Err(e) => {
                error!("Error while crawling {}: {:?}", contest_id, e);
                sleep_1sec();
            }
        }
    }
}

async fn crawl_one_contest(url: &str, contest_id: &str) -> Result<()> {
    let db = initialize_pool(url).await?;
    let crawler = WholeContestCrawler::new(db, AtCoderClient::default(), contest_id);
    crawler.crawl().await?;
    Ok(())
}

async fn load_contest(url: &str) -> Result<Vec<Contest>> {
    let db = initialize_pool(url).await?;
    let contests = db.load_contests().await?;
    Ok(contests)
}

fn sleep_1sec() {
    thread::sleep(time::Duration::from_millis(1000));
}
