use crate::crawler::SubmissionFetcher;
use crate::error::Result;
use crate::sql::internal::virtual_contest_manager::VirtualContestManager;
use crate::sql::{ContestProblemClient, SubmissionClient};
use std::collections::BTreeSet;

pub struct VirtualContestCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> VirtualContestCrawler<C, F>
where
    C: SubmissionClient + VirtualContestManager + ContestProblemClient,
    F: SubmissionFetcher,
{
    pub fn new(db: C, fetcher: F) -> Self {
        Self { db, fetcher }
    }

    pub fn crawl(&self) -> Result<()> {
        let pairs = self.db.load_contest_problem()?;
        let contests = self.db.get_recent_contests()?;

        let problem_set = contests
            .into_iter()
            .flat_map(|c| c.problems)
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
                let submissions = self.fetcher.fetch_submissions(&contest, page);
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
                if streak >= 5 {
                    break;
                }
            }
            log::info!("Finished {}", contest);
        }

        Ok(())
    }
}
