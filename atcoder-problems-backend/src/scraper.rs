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

pub fn scrape_contests(page: usize) -> Option<Vec<Contest>> {
    let url = format!("{}/contests/archive?lang=ja&page={}", ATCODER_HOST, page);
    let html = get_html(&url).ok()?;
    contest::scrape(&html)
}

pub fn scrape_submissions(
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

pub fn scrape_problems(contest_id: &str) -> Option<Vec<Problem>> {
    let url = format!("{}/contests/{}/tasks", ATCODER_HOST, contest_id);
    let page_html = get_html(&url).ok()?;
    problem::scrape(&page_html, contest_id)
}
