use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::Value;

use crate::error::CrawlerError;
use crate::parser::{parse_submissions_html, parse_tasks_html};
use crate::types::{Problem, Submission};

pub struct CrawlerClient {
    client: Client,
}

impl CrawlerClient {
    pub fn new(session_cookie: String) -> Result<Self, CrawlerError> {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Cookie",
            HeaderValue::from_str(&format!("REVEL_SESSION={}", session_cookie))?,
        );
        Ok(Self {
            client: Client::builder()
                .gzip(true)
                .default_headers(headers)
                .build()?,
        })
    }

    pub async fn fetch_problems(&self, contest_id: &str) -> Result<Vec<Problem>, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/{}/tasks", contest_id);
        let request = self.client.get(&url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
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
        let request = self.client.get(&url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let html = response.text().await?;
        parse_submissions_html(&html)
    }

    pub async fn fetch_standings(&self, contest_id: &str) -> Result<Value, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/{}/standings/json", contest_id);
        let request = self.client.get(&url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let text = response.text().await?;
        serde_json::from_str(&text).map_err(|_| CrawlerError::JsonParseError { body: text })
    }
}
