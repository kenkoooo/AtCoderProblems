use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::RecentCrawler;
use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::sql::connect;
use futures::executor::block_on;
use std::{env, thread, time};

async fn crawl(url: &str) -> Result<()> {
    let db = connect(url)?;
    let crawler = RecentCrawler::new(db, AtCoderClient::default());
    crawler.crawl().await
}

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    log::info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");

    loop {
        log::info!("Start new loop");
        if let Err(e) = block_on(crawl(&url)) {
            log::error!("{:?}", e);
            thread::sleep(time::Duration::from_millis(1000));
        }
    }
}
