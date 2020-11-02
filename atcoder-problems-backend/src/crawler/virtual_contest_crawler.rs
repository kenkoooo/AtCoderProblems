use crate::crawler::AtCoderFetcher;
use anyhow::Result;
use chrono::Utc;
use rand::distributions::Uniform;
use rand::Rng;
use sql_client::contest_problem::ContestProblemClient;
use sql_client::internal::virtual_contest_manager::VirtualContestManager;
use sql_client::submission_client::SubmissionClient;
use std::collections::BTreeSet;
use std::{thread, time};

const CRAWLED_STREAK: usize = 3;
const CONTEST_LENGTH_LIMIT_SECOND: i64 = 60 * 60 * 5;

pub struct VirtualContestCrawler<'a, P, F, R> {
    db_pool: P,
    fetcher: F,
    rng: &'a mut R,
}

impl<'a, P, F, R> VirtualContestCrawler<'a, P, F, R>
where
    P: ContestProblemClient + VirtualContestManager + SubmissionClient + Sync,
    F: AtCoderFetcher,
    R: Rng,
{
    pub fn new(db_pool: P, fetcher: F, rng: &'a mut R) -> Self {
        Self {
            db_pool,
            fetcher,
            rng,
        }
    }

    pub async fn crawl(&mut self) -> Result<()> {
        log::info!("Loading contests ...");
        let now = Utc::now().timestamp();
        let pairs = self.db_pool.load_contest_problem().await?;
        let mut problems = self.db_pool.get_running_contest_problems(now).await?;
        let past_problems = self.db_pool.get_running_contest_problems(now - 120).await?;
        problems.extend(past_problems);

        let mut problem_ids = problems
            .into_iter()
            .filter_map(|(problem_id, end_second)| {
                let remaining_second = end_second - now;
                if select(self.rng, remaining_second) {
                    Some(problem_id)
                } else {
                    None
                }
            })
            .collect::<Vec<_>>();
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
                let stored_submissions =
                    self.db_pool.count_stored_submissions(&fetched_ids).await?;

                if fetched_ids.len() == stored_submissions {
                    streak += 1;
                } else {
                    streak = 0;
                }

                self.db_pool.update_submissions(&submissions).await?;

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

fn select<R: Rng>(rng: &mut R, remaining_second: i64) -> bool {
    remaining_second <= 0
        || rng.sample(Uniform::from(0..remaining_second)) < CONTEST_LENGTH_LIMIT_SECOND
}
