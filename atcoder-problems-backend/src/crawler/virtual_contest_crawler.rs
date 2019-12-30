use crate::crawler::AtCoderFetcher;
use crate::error::Result;
use crate::sql::internal::virtual_contest_manager::VirtualContestManager;
use crate::sql::{ContestProblemClient, SubmissionClient};
use std::collections::BTreeSet;
use std::{thread, time};

const CRAWLED_STREAK: usize = 3;

pub struct VirtualContestCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> VirtualContestCrawler<C, F>
where
    C: SubmissionClient + VirtualContestManager + ContestProblemClient,
    F: AtCoderFetcher,
{
    pub fn new(db: C, fetcher: F) -> Self {
        Self { db, fetcher }
    }

    pub async fn crawl(&self) -> Result<()> {
        let pairs = self.db.load_contest_problem()?;
        let contests = self.db.get_recent_contests()?;

        let problem_set = contests
            .into_iter()
            .flat_map(|c| c.problems)
            .map(|problem| problem.id)
            .collect::<BTreeSet<_>>();
        let contest_set = pairs
            .into_iter()
            .filter(|pair| problem_set.contains(&pair.problem_id))
            .map(|pair| pair.contest_id)
            .collect::<BTreeSet<_>>();

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
