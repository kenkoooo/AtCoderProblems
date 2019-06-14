mod contest;
mod problem;
mod results;
mod submission;

use crate::sql::models::{Contest, Problem, Submission};

pub use self::results::get_performances;

const ATCODER_HOST: &str = "https://atcoder.jp";

fn get_html(url: &str) -> reqwest::Result<String> {
    reqwest::Client::new()
        .get(url)
        .header(reqwest::header::ACCEPT, "text/html")
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
}
