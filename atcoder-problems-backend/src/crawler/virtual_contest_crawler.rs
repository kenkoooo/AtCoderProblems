use crate::crawler::AtCoderFetcher;
use crate::sql::SubmissionClient;
use anyhow::Result;
use chrono::Utc;
use sql_client::contest_problem::ContestProblemClient;
use sql_client::internal::virtual_contest_manager::VirtualContestManager;
use std::collections::BTreeSet;
use std::{thread, time};

const CRAWLED_STREAK: usize = 3;

pub struct VirtualContestCrawler<C, P, F> {
    db: C,
    db_pool: P,
    fetcher: F,
}

impl<C, P, F> VirtualContestCrawler<C, P, F>
where
    C: SubmissionClient,
    P: ContestProblemClient + VirtualContestManager,
    F: AtCoderFetcher,
{
    pub fn new(db: C, db_pool: P, fetcher: F) -> Self {
        Self {
            db,
            db_pool,
            fetcher,
        }
    }

    pub async fn crawl(&self) -> Result<()> {
        log::info!("Loading contests ...");
        let now = Utc::now().timestamp();
        let pairs = self.db_pool.load_contest_problem().await?;
        let mut problem_ids = self.db_pool.get_running_contest_problems(now).await?;
        let past_problems = self.db_pool.get_running_contest_problems(now - 120).await?;
        problem_ids.extend(past_problems);
        problem_ids.sort();
        problem_ids.dedup();

        let contest_set = pairs
            .into_iter()
            .filter(|pair| problem_ids.binary_search(&pair.problem_id).is_ok())
            .map(|pair| pair.contest_id)
            .collect::<BTreeSet<_>>();
        log::info!("Loaded {} contests", contest_set.len());

        for contest in contest_set.into_iter() {
            log::info!("Starting {} ...", contest);
            let mut streak = 0;
            for page in 1.. {
                log::info!("Fetching from {} {} ...", contest, page);
                let submissions = self.fetcher.fetch_submissions(&contest, page).await;
                if submissions.is_empty() {
                    break;
                }
                let fetched_ids = submissions.iter().map(|s| s.id).collect::<Vec<_>>();
                let stored_submissions = self.db.count_stored_submissions(&fetched_ids)?;

                if fetched_ids.len() == stored_submissions {
                    streak += 1;
                } else {
                    streak = 0;
                }

                self.db.update_submissions(&submissions)?;

                if streak >= CRAWLED_STREAK {
                    break;
                }
                thread::sleep(time::Duration::from_millis(200));
            }
            log::info!("Finished {}", contest);
        }

        Ok(())
    }
}
