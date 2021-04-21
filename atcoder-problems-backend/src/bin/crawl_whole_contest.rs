use atcoder_client::AtCoderClient;
use anyhow::Result;
use atcoder_problems_backend::crawler::WholeContestCrawler;
use atcoder_problems_backend::utils::init_log_config;
use log::info;
use sql_client::initialize_pool;
use std::env;

#[async_std::main]
async fn main() -> Result<()> {
    init_log_config()?;
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let contest_id = env::args().nth(1).expect("contest_id is not set.");
    let db = initialize_pool(&url).await?;
    let crawler = WholeContestCrawler::new(db, AtCoderClient::default(), contest_id);
    crawler.crawl().await?;
    Ok(())
}
