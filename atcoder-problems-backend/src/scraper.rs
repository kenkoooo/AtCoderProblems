mod contest;
mod problem;
mod submission;

use crate::sql::models::{Contest, Performance, Problem, Submission};

use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_ENCODING};
use serde::Deserialize;
use std::collections::BTreeMap;

const ATCODER_HOST: &str = "https://atcoder.jp";

fn get_html(url: &str) -> reqwest::Result<String> {
    let mut headers = HeaderMap::new();
    headers.insert(ACCEPT, HeaderValue::from_static("text/html"));
    headers.insert(ACCEPT_ENCODING, HeaderValue::from_static("gzip"));
    reqwest::Client::new()
        .get(url)
        .headers(headers)
        .send()?
        .text()
}

pub trait ScraperTrait {
    fn scrape_contests(&self, page: usize) -> Option<Vec<Contest>>;
    fn scrape_submissions(
        &self,
        contest_id: &str,
        page: Option<usize>,
    ) -> Option<(Vec<Submission>, usize)>;
    fn scrape_problems(&self, contest_id: &str) -> Option<Vec<Problem>>;
    fn scrape_performances(&self, contest_id: &str) -> Option<Vec<Performance>>;
}

pub struct Scraper;

impl ScraperTrait for Scraper {
    fn scrape_contests(&self, page: usize) -> Option<Vec<Contest>> {
        let url = format!("{}/contests/archive?lang=ja&page={}", ATCODER_HOST, page);
        let html = get_html(&url).ok()?;
        contest::scrape(&html)
    }

    fn scrape_submissions(
        &self,
        contest_id: &str,
        page: Option<usize>,
    ) -> Option<(Vec<Submission>, usize)> {
        let page = page.unwrap_or(1);
        let url = format!(
            "{}/contests/{}/submissions?page={}",
            ATCODER_HOST, contest_id, page
        );
        let html = get_html(&url).ok()?;
        let submissions = submission::scrape(&html, contest_id)?;
        let max_page = submission::scrape_submission_page_count(&html)?;
        Some((submissions, max_page))
    }

    fn scrape_problems(&self, contest_id: &str) -> Option<Vec<Problem>> {
        let url = format!("{}/contests/{}/tasks", ATCODER_HOST, contest_id);
        let page_html = get_html(&url).ok()?;
        problem::scrape(&page_html, contest_id)
    }

    fn scrape_performances(&self, contest_id: &str) -> Option<Vec<Performance>> {
        #[derive(Deserialize, Debug, Clone)]
        struct ContestPerformance {
            #[serde(rename = "Place")]
            place: u64,

            #[serde(rename = "Performance")]
            inner_performance: i64,
        }

        #[derive(Deserialize, Debug, Clone)]
        struct ContestStandings {
            #[serde(rename = "StandingsData")]
            standings: Vec<ContestStanding>,
        }

        #[derive(Deserialize, Debug, Clone)]
        struct ContestStanding {
            #[serde(rename = "Rank")]
            place: u64,

            #[serde(rename = "UserScreenName")]
            user_id: String,
        }

        let url = format!("{}/contests/{}/standings/json", ATCODER_HOST, contest_id);
        let standings = reqwest::get(&url)
            .ok()?
            .json::<ContestStandings>()
            .ok()?
            .standings
            .into_iter()
            .map(|s| (s.place, s.user_id))
            .collect::<BTreeMap<_, _>>();

        let url = format!("{}/contests/{}/results/json", ATCODER_HOST, contest_id);
        let performances = reqwest::get(&url)
            .ok()?
            .json::<Vec<ContestPerformance>>()
            .ok()?
            .into_iter()
            .filter_map(|p| {
                standings.get(&p.place).map(|user_id| Performance {
                    inner_performance: p.inner_performance,
                    user_id: user_id.to_string(),
                    contest_id: contest_id.to_string(),
                })
            })
            .collect::<Vec<_>>();
        Some(performances)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scrape_performances() {
        let contest_id = "soundhound2018-summer-qual";
        let scraper = Scraper;
        let performances = scraper.scrape_performances(contest_id).unwrap();
        assert_eq!(performances.len(), 1852);
    }
}
