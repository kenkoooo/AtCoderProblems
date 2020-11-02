use algorithm_problem_client::AtCoderClient;
use anyhow::Result;
use atcoder_problems_backend::crawler::WholeContestCrawler;
use log::info;
use sql_client::initialize_pool;
use sql_client::simple_client::SimpleClient;
use std::{env, thread, time};

const NEW_CONTEST_NUM: usize = 5;

async fn iteration(url: &str) -> Result<()> {
    let db = initialize_pool(&url).await?;
    let mut contests = db.load_contests().await?;
    contests.sort_by_key(|c| c.start_epoch_second);
    contests.reverse();

    for contest in &contests[0..NEW_CONTEST_NUM] {
        info!("Starting {}", contest.id);
        let crawler = WholeContestCrawler::new(db.clone(), AtCoderClient::default(), &contest.id);
        crawler.crawl().await?;
    }
    Ok(())
}

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    loop {
        info!("Start new loop");
        if let Err(e) = iteration(&url).await {
            log::error!("{:?}", e);
            thread::sleep(time::Duration::from_millis(1000));
        }
    }
}
