use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::WholeContestCrawler;
use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::sql::{connect, SimpleClient};
use futures::executor::block_on;
use log::info;
use std::{env, thread, time};

async fn iteration(url: &str) -> Result<()> {
    let db = connect(url)?;
    let contests = db.load_contests()?;

    for contest in contests.into_iter() {
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
