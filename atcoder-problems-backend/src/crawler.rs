mod fix_crawler;
mod problem_crawler;
mod recent_crawler;
pub(crate) mod utils;
mod virtual_contest_crawler;
mod whole_contest_crawler;

pub use fix_crawler::FixCrawler;
pub use problem_crawler::ProblemCrawler;
pub use recent_crawler::RecentCrawler;
pub use virtual_contest_crawler::VirtualContestCrawler;
pub use whole_contest_crawler::WholeContestCrawler;

use crate::error::Result;
use crate::sql::models::{Contest, ContestProblem, Problem, Submission};
use algorithm_problem_client::{AtCoderClient, AtCoderProblem, AtCoderSubmission};
use async_trait::async_trait;
use log::info;

#[async_trait]
pub trait AtCoderFetcher {
    async fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission>;
    async fn fetch_contests(&self, page: u32) -> Result<Vec<Contest>>;
    async fn fetch_problems(&self, contest_id: &str)
        -> Result<(Vec<Problem>, Vec<ContestProblem>)>;
}

#[async_trait]
impl AtCoderFetcher for AtCoderClient {
    async fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission> {
        let submissions = retry_fetch_submissions(self, 5, contest_id, page);
        submissions
            .await
            .into_iter()
            .map(|s| Submission {
                id: s.id as i64,
                epoch_second: s.epoch_second as i64,
                problem_id: s.problem_id,
                contest_id: s.contest_id,
                user_id: s.user_id,
                language: s.language,
                point: s.point,
                length: s.length as i32,
                result: s.result,
                execution_time: s.execution_time.map(|t| t as i32),
            })
            .collect()
    }

    async fn fetch_contests(&self, page: u32) -> Result<Vec<Contest>> {
        info!("Fetching contests page-{}", page);
        let contests = self.fetch_atcoder_contests(page).await?;
        let contests = contests
            .into_iter()
            .map(|c| Contest {
                id: c.id,
                start_epoch_second: c.start_epoch_second as i64,
                duration_second: c.duration_second as i64,
                title: c.title,
                rate_change: c.rate_change,
            })
            .collect::<Vec<_>>();
        Ok(contests)
    }

    async fn fetch_problems(
        &self,
        contest_id: &str,
    ) -> Result<(Vec<Problem>, Vec<ContestProblem>)> {
        info!("Fetching problems from {} ...", contest_id);
        let problems = self.fetch_problem_list(contest_id).await?;
        let problems = problems
            .into_iter()
            .map(convert_problem)
            .collect::<Vec<_>>();
        let contest_problem = problems
            .iter()
            .map(|problem| ContestProblem {
                problem_id: problem.id.clone(),
                contest_id: problem.contest_id.clone(),
            })
            .collect::<Vec<_>>();
        Ok((problems, contest_problem))
    }
}

async fn retry_fetch_submissions(
    client: &AtCoderClient,
    retry_count: usize,
    contest_id: &str,
    page: u32,
) -> Vec<AtCoderSubmission> {
    for _ in 0..retry_count {
        match client
            .fetch_atcoder_submission_list(contest_id, Some(page))
            .await
        {
            Ok(response) => {
                return response.submissions;
            }
            Err(e) => {
                log::error!("Error when fetching {} {}: {:?} ", contest_id, page, e);
                log::info!("Sleeping 1sec before retry ...");
                async_std::task::sleep(std::time::Duration::from_secs(1)).await;
            }
        }
    }
    Vec::new()
}

fn convert_problem(p: AtCoderProblem) -> Problem {
    Problem {
        id: p.id,
        contest_id: p.contest_id,
        title: p.position + ". " + p.title.as_str(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::executor::block_on;

    #[test]
    fn test_convert_problem() {
        let p = AtCoderProblem {
            id: "id".to_owned(),
            contest_id: "contest_id".to_owned(),
            title: "title".to_owned(),
            position: "A".to_owned(),
        };
        let p = convert_problem(p);
        assert_eq!(p.id, "id".to_owned());
        assert_eq!(p.contest_id, "contest_id".to_owned());
        assert_eq!(p.title, "A. title".to_owned());
    }
}
