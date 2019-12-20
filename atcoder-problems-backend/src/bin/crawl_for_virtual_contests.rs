use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler::{FixCrawler, VirtualContestCrawler};
use atcoder_problems_backend::sql::{SubmissionClient, SubmissionRequest};
use chrono::Utc;
use diesel::{Connection, PgConnection};
use std::collections::BTreeSet;
use std::error::Error;
use std::time::{Duration, Instant};
use std::{env, thread};

const FIX_RANGE_SECOND: i64 = 10 * 60;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    log::info!("Started");

    loop {
        log::info!("Start new loop...");
        let now = Instant::now();

        log::info!("Start crawling...");
        let url = env::var("SQL_URL")?;
        let conn = PgConnection::establish(&url)?;
        let crawler = VirtualContestCrawler::new(conn, AtCoderClient::default());
        crawler.crawl()?;
        log::info!("Finished crawling");

        log::info!("Starting fixing...");
        let conn = PgConnection::establish(&url)?;
        let cur = Utc::now().timestamp();
        let crawler = FixCrawler::new(conn, AtCoderClient::default(), cur - FIX_RANGE_SECOND);
        crawler.crawl()?;
        log::info!("Finished fixing");

        log::info!("Start updating...");
        let conn = PgConnection::establish(&url)?;
        let request = SubmissionRequest::RecentAccepted { count: 1000 };
        let recent_submissions = conn.get_submissions(request)?;

        let user_ids = recent_submissions
            .into_iter()
            .map(|s| s.user_id)
            .collect::<BTreeSet<_>>();
        let user_ids = user_ids.iter().map(|s| s.as_str()).collect::<Vec<_>>();

        log::info!("Loading submissions of {} users ...", user_ids.len());
        let request = SubmissionRequest::UsersAccepted {
            user_ids: &user_ids,
        };
        let user_accepted_submissions = conn.get_submissions(request)?;
        conn.update_delta_submission_count(&user_accepted_submissions)?;
        log::info!("Finished updating");

        let elapsed_secs = now.elapsed().as_secs();
        log::info!("Elapsed {} sec.", elapsed_secs);
        if elapsed_secs < 10 {
            let sleep = elapsed_secs - 10;
            log::info!("Sleeping {} sec.", sleep);
            thread::sleep(Duration::from_secs(sleep));
        }

        log::info!("Finished a loop");
    }
}
