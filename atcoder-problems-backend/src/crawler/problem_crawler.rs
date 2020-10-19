use crate::crawler::AtCoderFetcher;
use anyhow::Result;
use sql_client::contest_problem::ContestProblemClient;
use sql_client::models::{Contest, ContestProblem, Problem};
use sql_client::simple_client::SimpleClient;
use std::collections::BTreeSet;
use std::{thread, time};

pub struct ProblemCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> ProblemCrawler<C, F>
where
    F: AtCoderFetcher,
    C: SimpleClient + ContestProblemClient,
{
    pub fn new(db: C, fetcher: F) -> Self {
        Self { db, fetcher }
    }
    pub async fn crawl(&self) -> Result<()> {
        log::info!("Starting...");
        let mut contests = Vec::new();
        for page in 1.. {
            match self.fetcher.fetch_contests(page).await {
                Ok(c) => {
                    if c.is_empty() {
                        break;
                    }
                    contests.extend(c);
                }
                Err(e) => {
                    log::error!("{:?}", e);
                    break;
                }
            }
            thread::sleep(time::Duration::from_millis(500));
        }

        log::info!("There are {} contests.", contests.len());
        self.db.insert_contests(&contests).await?;

        let contests = self.db.load_contests().await?;
        let problems = self.db.load_problems().await?;
        let contest_problem = self.db.load_contest_problem().await?;

        let no_problem_contests =
            extract_no_problem_contests(&contests, &problems, &contest_problem);

        for contest in no_problem_contests.into_iter() {
            log::info!("Crawling problems of {}...", contest.id);
            match self.fetcher.fetch_problems(&contest.id).await {
                Ok((problems, contest_problem)) => {
                    self.db.insert_problems(&problems).await?;
                    self.db.insert_contest_problem(&contest_problem).await?;
                }
                Err(e) => {
                    log::error!("{:?}", e);
                }
            }
            thread::sleep(time::Duration::from_millis(500));
        }

        Ok(())
    }
}

fn extract_no_problem_contests<'a>(
    contests: &'a [Contest],
    problems: &'a [Problem],
    contest_problems: &'a [ContestProblem],
) -> Vec<&'a Contest> {
    let problem_set = problems.iter().map(|p| &p.id).collect::<BTreeSet<_>>();
    let contest_with_problems = contest_problems
        .iter()
        .filter(|p| problem_set.contains(&p.problem_id))
        .map(|c| &c.contest_id)
        .collect::<BTreeSet<_>>();
    contests
        .iter()
        .filter(|c| !contest_with_problems.contains(&c.id))
        .collect::<Vec<_>>()
}
