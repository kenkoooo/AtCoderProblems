pub mod fix_crawler;

use crate::error::Result;
use crate::sql::models::{Contest, ContestProblem, Problem, Submission};
use crate::sql::{ContestProblemClient, SimpleClient, SubmissionClient, SubmissionRequest};
use algorithm_problem_client::{AtCoderClient, AtCoderProblem};
use chrono::{Duration, Utc};
use log::{error, info};
use std::collections::BTreeSet;
use std::{thread, time};

const NEW_CONTEST_THRESHOLD_DAYS: i64 = 7;
const NEW_PAGE_THRESHOLD: usize = 5;

pub(crate) trait Fetcher {
    fn fetch_submissions(&self, contest_id: &str, page: usize) -> Result<(Vec<Submission>, usize)>;
}

pub fn crawl_from_new_contests<C>(conn: &C, client: &AtCoderClient) -> Result<()>
where
    C: SimpleClient + SubmissionClient,
{
    info!("Starting new loop...");
    let mut contests = conn.load_contests()?;
    let now = Utc::now().timestamp();

    let newest_contest_epoch_second = contests
        .iter()
        .map(|contest| contest.start_epoch_second)
        .max();
    if newest_contest_epoch_second.is_none() {
        info!("There is no contests in DB");
        return Ok(());
    }
    let newest_contest_epoch_second = newest_contest_epoch_second.unwrap();

    contests.sort_by_key(|contest| -contest.start_epoch_second);
    for contest in contests.into_iter().filter(|contest| {
        is_new_contest(now, contest.start_epoch_second)
            || contest.start_epoch_second == newest_contest_epoch_second
    }) {
        info!("Starting for {}", contest.id);
        match client.fetch_atcoder_submission_list(&contest.id, None) {
            Ok(response) => {
                info!("There are {} pages on {}", response.max_page, contest.id);
                for page in (1..=response.max_page).rev() {
                    info!("Crawling {} {}", contest.id, page);
                    let new_submissions = client.fetch_submissions(&contest.id, page);
                    info!("Inserting {} submissions...", new_submissions.len());
                    conn.update_submissions(&new_submissions)?;
                    thread::sleep(time::Duration::from_millis(200));
                }
            }
            _ => {
                error!("Error to load!");
            }
        }
    }
    Ok(())
}

pub fn crawl_all_submissions<C>(conn: &C, client: &AtCoderClient) -> Result<()>
where
    C: SimpleClient + SubmissionClient,
{
    info!("Starting new loop...");
    let contests = conn.load_contests()?;
    for contest in contests.into_iter() {
        info!("Starting for {}", contest.id);
        match client.fetch_atcoder_submission_list(&contest.id, None) {
            Ok(response) => {
                info!("There are {} pages on {}", response.max_page, contest.id);
                for page in (1..=response.max_page).rev() {
                    info!("Crawling {} {}", contest.id, page);
                    let new_submissions = client.fetch_submissions(&contest.id, page);
                    info!("Inserting {} submissions", new_submissions.len());
                    conn.update_submissions(&new_submissions)?;
                    thread::sleep(time::Duration::from_millis(200));
                }
            }
            _ => {
                error!("Error!");
            }
        }
    }
    Ok(())
}

pub fn crawl_new_submissions<C>(conn: &C, client: &AtCoderClient) -> Result<()>
where
    C: SimpleClient + SubmissionClient,
{
    info!("Starting new loop...");
    let contests = conn.load_contests()?;
    let now = Utc::now().timestamp();
    for contest in contests
        .into_iter()
        .filter(|contest| !is_new_contest(now, contest.start_epoch_second))
    {
        for page in 1..=NEW_PAGE_THRESHOLD {
            info!("Crawling {} {}", contest.id, page);
            let new_submissions = client.fetch_submissions(&contest.id, page as u32);
            if new_submissions.is_empty() {
                info!("There is no submission on {}-{}", contest.id, page);
                break;
            }

            info!("Inserting {} submissions...", new_submissions.len());
            let min_id = new_submissions.iter().map(|s| s.id).min().unwrap_or(0);
            let exists = conn.get_submission_by_id(min_id)?.is_some();
            conn.update_submissions(&new_submissions)?;
            thread::sleep(time::Duration::from_millis(200));

            if exists {
                break;
            }
        }
    }
    Ok(())
}

pub fn crawl_from_recent_submitted<C>(conn: &C, client: &AtCoderClient) -> Result<()>
where
    C: SimpleClient + SubmissionClient,
{
    info!("Starting new loop...");
    let submissions = conn.get_submissions(SubmissionRequest::RecentAll { count: 2000 })?;
    let contests = submissions
        .into_iter()
        .map(|s| s.contest_id)
        .collect::<BTreeSet<_>>();

    for contest in contests.into_iter() {
        for page in 1..=NEW_PAGE_THRESHOLD {
            info!("Crawling {} {}", contest, page);
            let new_submissions = client.fetch_submissions(&contest, page as u32);
            if new_submissions.is_empty() {
                info!("There is no submission on {}-{}", contest, page);
                break;
            }

            info!("Inserting {} submissions...", new_submissions.len());
            let min_id = new_submissions.iter().map(|s| s.id).min().unwrap_or(0);
            let exists = conn.get_submission_by_id(min_id)?.is_some();
            conn.update_submissions(&new_submissions)?;
            thread::sleep(time::Duration::from_millis(200));

            if exists {
                break;
            }
        }
    }
    Ok(())
}

pub fn crawl_contest_and_problems<C>(conn: &C, client: &AtCoderClient) -> Result<()>
where
    C: SimpleClient + ContestProblemClient,
{
    info!("Starting...");
    let contests: Vec<_> = (1..)
        .map(|page| {
            info!("crawling contest page-{}", page);
            match client.fetch_atcoder_contests(page) {
                Ok(contests) => {
                    thread::sleep(time::Duration::from_secs(1));
                    contests
                }
                _ => Vec::new(),
            }
        })
        .take_while(|contests| !contests.is_empty())
        .flatten()
        .map(|c| Contest {
            id: c.id,
            start_epoch_second: c.start_epoch_second as i64,
            duration_second: c.duration_second as i64,
            title: c.title,
            rate_change: c.rate_change,
        })
        .collect();

    info!("There are {} contests.", contests.len());
    conn.insert_contests(&contests)?;

    let contests = conn.load_contests()?;
    let problems = conn.load_problems()?;
    let contest_problem = conn.load_contest_problem()?;

    let no_problem_contests = extract_no_problem_contests(&contests, &problems, &contest_problem);

    for contest in no_problem_contests.into_iter() {
        info!("Crawling problems of {}...", contest.id);
        match client.fetch_problem_list(&contest.id) {
            Ok(problems) => {
                info!("Inserting {} problems...", problems.len());
                let problems = problems
                    .into_iter()
                    .map(convert_problem)
                    .collect::<Vec<Problem>>();
                conn.insert_problems(&problems)?;
                let contest_problem = problems
                    .into_iter()
                    .map(|problem| ContestProblem {
                        problem_id: problem.id,
                        contest_id: problem.contest_id,
                    })
                    .collect::<Vec<_>>();
                conn.insert_contest_problem(&contest_problem)?;
            }
            _ => error!("Failed to crawl contests!"),
        }

        thread::sleep(time::Duration::from_millis(500));
    }

    Ok(())
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

trait SubmissionFetcher {
    fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission>;
}

impl SubmissionFetcher for AtCoderClient {
    fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission> {
        self.fetch_atcoder_submission_list(contest_id, Some(page))
            .map(|response| response.submissions)
            .unwrap_or_else(|_| Vec::new())
            .into_iter()
            .map(|s| Submission {
                id: s.id as i64,
                epoch_second: s.epoch_second as i64,
                problem_id: s.problem_id,
                contest_id: s.contest_id,
                user_id: s.user_id,
                language: s.language,
                point: s.point as f64,
                length: s.length as i32,
                result: s.result,
                execution_time: s.execution_time.map(|t| t as i32),
            })
            .collect()
    }
}

fn is_new_contest(current_time_second: i64, contest_start_second: i64) -> bool {
    current_time_second - contest_start_second
        <= Duration::days(NEW_CONTEST_THRESHOLD_DAYS).num_seconds()
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
