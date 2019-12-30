use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::WholeContestCrawler;
use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::sql::{connect, SimpleClient};
use futures::executor::block_on;
use log::info;
use std::{env, thread, time};

const NEW_CONTEST_NUM: usize = 5;

async fn iteration(url: &str) -> Result<()> {
    let db = connect(url)?;
    let mut contests = db.load_contests()?;
    contests.sort_by_key(|c| c.start_epoch_second);
    contests.reverse();

    for contest in &contests[0..NEW_CONTEST_NUM] {
        info!("Starting {}", contest.id);
        let db = connect(url)?;
        let crawler = WholeContestCrawler::new(db, AtCoderClient::default(), &contest.id);
        crawler.crawl().await?;
    }
    Ok(())
}

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");

    loop {
        info!("Start new loop");
        if let Err(e) = block_on(iteration(&url)) {
            log::error!("{:?}", e);
            thread::sleep(time::Duration::from_millis(1000));
        }
    }
}
