use reqwest::Client;

use crate::error::CrawlerError;
use crate::parser::{parse_submissions_html, parse_tasks_html};
use crate::types::{Problem, Submission};

pub struct CrawlerClient {
    client: Client,
}

impl CrawlerClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    pub async fn fetch_problems(&self, contest_id: &str) -> Result<Vec<Problem>, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/{}/tasks", contest_id);
        let response = self.client.get(&url).send().await?;
        let html = response.text().await?;
        parse_tasks_html(&html)
    }

    pub async fn fetch_submissions(
        &self,
        contest_id: &str,
        page: i32,
    ) -> Result<Vec<Submission>, CrawlerError> {
        let url = format!(
            "https://atcoder.jp/contests/{}/submissions?page={}",
            contest_id, page
        );
        let response = self.client.get(&url).send().await?;
        let html = response.text().await?;
        parse_submissions_html(&html)
    }
}
