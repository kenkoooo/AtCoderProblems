use crate::scraper;
use crate::scraper::ScraperTrait;
use crate::sql::models::{Contest, ContestProblem, Problem};
use crate::sql::{ContestProblemClient, SimpleClient, SubmissionClient};
use crate::utils;
use chrono::{Duration, Utc};
use log::{error, info};
use std::collections::BTreeSet;
use std::{thread, time};

const NEW_CONTEST_THRESHOLD_DAYS: i64 = 2;
const NEW_PAGE_THRESHOLD: usize = 5;

pub fn crawl_from_new_contests<C, S>(conn: &C, scraper: &S)
where
    C: SimpleClient + SubmissionClient,
    S: ScraperTrait,
{
    loop {
        info!("Starting new loop...");
        let mut contests = conn.load_contests().expect("Failed to load contests");
        let now = Utc::now().timestamp();

        contests.sort_by_key(|contest| -contest.start_epoch_second);
        for (_, contest) in contests.into_iter().enumerate().filter(|(i, contest)| {
            *i == 0 || now - contest.start_epoch_second < Duration::days(3).num_seconds()
        }) {
            info!("Starting for {}", contest.id);
            match scraper.scrape_submissions(&contest.id, None) {
                Some((_, max_page)) => {
                    info!("There are {} pages on {}", max_page, contest.id);
                    for page in (1..=max_page).rev() {
                        info!("Crawling {} {}", contest.id, page);
                        let new_submissions = scraper
                            .scrape_submissions(&contest.id, Some(page))
                            .map(|(s, _)| s)
                            .unwrap_or_else(Vec::new);
                        info!("Inserting {} submissions...", new_submissions.len());
                        conn.update_submissions(&new_submissions)
                            .expect("Failed to insert submissions");
                        thread::sleep(time::Duration::from_millis(200));
                    }
                }
                None => {
                    error!("Error to load!");
                }
            }
        }
    }
}

pub fn crawl_all_submissions<C, S>(conn: &C, scraper: &S)
where
    C: SimpleClient + SubmissionClient,
    S: ScraperTrait,
{
    loop {
        info!("Starting new loop...");
        let contests = conn.load_contests().expect("Failed to load contests");
        for contest in contests.into_iter() {
            info!("Starting for {}", contest.id);
            match scraper.scrape_submissions(&contest.id, None) {
                Some((_, max_page)) => {
                    info!("There are {} pages on {}", max_page, contest.id);

                    for page in (1..=max_page).rev() {
                        info!("Crawling {} {}", contest.id, page);
                        let new_submissions = scraper
                            .scrape_submissions(&contest.id, Some(page))
                            .map(|(s, _)| s)
                            .unwrap_or_else(Vec::new);
                        info!("Inserting {} submissions", new_submissions.len());
                        conn.update_submissions(&new_submissions)
                            .expect("Failed to insert submissions");
                        thread::sleep(time::Duration::from_millis(200));
                    }
                }
                None => {
                    error!("Error!");
                }
            }
        }
    }
}

pub fn crawl_new_submissions<C, S>(conn: &C, scraper: &S)
where
    C: SimpleClient + SubmissionClient,
    S: ScraperTrait,
{
    loop {
        info!("Starting new loop...");
        let contests = conn.load_contests().expect("Failed to load contests");
        let now = Utc::now().timestamp();
        for contest in contests.into_iter().filter(|contest| {
            now - contest.start_epoch_second
                > Duration::days(NEW_CONTEST_THRESHOLD_DAYS).num_seconds()
        }) {
            for page in 1..=NEW_PAGE_THRESHOLD {
                info!("Crawling {} {}", contest.id, page);
                let new_submissions = scraper
                    .scrape_submissions(&contest.id, Some(page))
                    .map(|(s, _)| s)
                    .unwrap_or_else(Vec::new);

                if new_submissions.is_empty() {
                    info!("There is no submission on {}-{}", contest.id, page);
                    break;
                }

                info!("Inserting {} submissions...", new_submissions.len());
                let min_id = new_submissions.iter().map(|s| s.id).min().unwrap();
                let exists = conn
                    .get_submission_by_id(min_id)
                    .expect("Failed to load submissions")
                    .is_some();
                conn.update_submissions(&new_submissions)
                    .expect("Failed to insert submissions");
                thread::sleep(time::Duration::from_millis(200));

                if exists {
                    break;
                }
            }
        }
    }
}

pub fn crawl_contest_and_problems<C, S>(conn: &C, scraper: &S)
where
    C: SimpleClient + ContestProblemClient,
    S: ScraperTrait,
{
    info!("Starting...");
    let contests: Vec<_> = (1..)
        .map(|page| {
            info!("crawling contest page-{}", page);
            match scraper.scrape_contests(page) {
                Some(contests) => {
                    thread::sleep(time::Duration::from_secs(1));
                    contests
                }
                None => Vec::new(),
            }
        })
        .take_while(|contests| !contests.is_empty())
        .flatten()
        .collect();

    info!("There are {} contests.", contests.len());
    conn.insert_contests(&contests).unwrap();

    let contests = conn.load_contests().expect("");
    let problems = conn.load_problems().expect("");
    let contest_problem = conn.load_contest_problem().expect("");

    let no_problem_contests = extract_no_problem_contests(&contests, &problems, &contest_problem);

    for contest in no_problem_contests.into_iter() {
        info!("Crawling problems of {}...", contest.id);
        match scraper.scrape_problems(&contest.id) {
            Some(problems) => {
                info!("Inserting {} problems...", problems.len());
                conn.insert_problems(&problems)
                    .expect("Failed to insert problems");
                let contest_problem = problems
                    .iter()
                    .map(|problem| ContestProblem {
                        problem_id: problem.id.clone(),
                        contest_id: problem.contest_id.clone(),
                    })
                    .collect::<Vec<_>>();
                conn.insert_contest_problem(&contest_problem)
                    .expect("Failed to insert contest-problem pairs");
            }
            None => error!("Failed to crawl contests!"),
        }

        thread::sleep(time::Duration::from_millis(500));
    }

    let performances = conn
        .load_performances()
        .expect("Failed to load performances.");
    let contests = utils::extract_non_performance_contests(&contests, &performances);
    for contest in contests.into_iter() {
        info!("Crawling results of {}", contest.id);
        let performances = scraper::get_performances(&contest.id).unwrap();

        info!("Inserting results of {}", contest.id);
        conn.insert_performances(&performances).unwrap();

        info!("Sleeping...");
        thread::sleep(time::Duration::from_millis(500));
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
