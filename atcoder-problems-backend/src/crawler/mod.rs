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

use anyhow::Result;
use async_trait::async_trait;
use atcoder_client::{AtCoderClient, AtCoderProblem, AtCoderSubmission, ContestTypeSpecifier};
use log::info;
use sql_client::models::{Contest, ContestProblem, Problem, Submission};

#[async_trait]
pub trait AtCoderFetcher {
    async fn fetch_submissions(&self, contest_id: &str, page: u32) -> (Vec<Submission>, u32);
    async fn fetch_contests(&self, spf: ContestTypeSpecifier) -> Result<Vec<Contest>>;
    async fn fetch_problems(&self, contest_id: &str)
        -> Result<(Vec<Problem>, Vec<ContestProblem>)>;
}

#[async_trait]
impl AtCoderFetcher for AtCoderClient {
    async fn fetch_submissions(&self, contest_id: &str, page: u32) -> (Vec<Submission>, u32) {
        let (submissions, max_page) = retry_fetch_submissions(self, 9, contest_id, page).await;
        let submissions = submissions
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
            .collect();
        (submissions, max_page)
    }

    async fn fetch_contests(&self, spf: ContestTypeSpecifier) -> Result<Vec<Contest>> {
        match spf {
            ContestTypeSpecifier::Normal { page } => {
                info!("Fetching contests page-{}", page);
            }
            ContestTypeSpecifier::Permanent => {
                info!("Fetching permanent contests");
            }
            ContestTypeSpecifier::Hidden => {
                info!("Fetching hidden contests");
            }
        };

        let contests = self.fetch_atcoder_contests(spf).await?;
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
        let atcoder_problems = self.fetch_problem_list(contest_id).await?;
        let contest_problem = atcoder_problems
            .iter()
            .map(|problem| ContestProblem {
                contest_id: problem.contest_id.clone(),
                problem_id: problem.id.clone(),
                problem_index: problem.position.clone(),
            })
            .collect::<Vec<_>>();
        let problems = atcoder_problems
            .into_iter()
            .map(convert_problem)
            .collect::<Vec<_>>();
        Ok((problems, contest_problem))
    }
}

async fn retry_fetch_submissions(
    client: &AtCoderClient,
    retry_count: usize,
    contest_id: &str,
    page: u32,
) -> (Vec<AtCoderSubmission>, u32) {
    let mut sleep_second = 1;
    for _ in 0..retry_count {
        match client
            .fetch_atcoder_submission_list(contest_id, Some(page))
            .await
        {
            Ok(response) => {
                return (response.submissions, response.max_page);
            }
            Err(e) => {
                log::error!("Error when fetching {} {}: {:?} ", contest_id, page, e);
                log::info!("Sleeping {}s before retry ...", sleep_second);
                actix_web::rt::time::sleep(std::time::Duration::from_secs(sleep_second)).await;
                sleep_second *= 2;
            }
        }
    }
    (Vec::new(), 0)
}

fn convert_problem(p: AtCoderProblem) -> Problem {
    Problem {
        id: p.id,
        contest_id: p.contest_id,
        problem_index: p.position.to_string(),
        title: p.position + ". " + p.title.as_str(),
        name: p.title.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
