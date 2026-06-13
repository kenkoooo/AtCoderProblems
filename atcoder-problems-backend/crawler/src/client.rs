use async_trait::async_trait;
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::Value;

use crate::error::CrawlerError;
use crate::parser::{
    parse_contests_archive_html, parse_permanent_contests_html, parse_submissions_html,
    parse_tasks_html,
};
use crate::types::{Contest, Problem, Submission};

/// Trait for fetching problems from AtCoder.
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait ProblemFetcher: Send + Sync {
    async fn fetch_problems(&self, contest_id: &str) -> Result<Vec<Problem>, CrawlerError>;
}

/// Trait for fetching contests from AtCoder.
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait ContestFetcher: Send + Sync {
    /// Fetch contests from the archive page
    async fn fetch_contests(&self, page: u32) -> Result<Vec<Contest>, CrawlerError>;
    /// Fetch contests from a category-filtered archive page
    async fn fetch_contests_in_category(
        &self,
        page: u32,
        category: u32,
    ) -> Result<Vec<Contest>, CrawlerError>;
    /// Fetch permanent contests (e.g., practice, APG4b)
    async fn fetch_permanent_contests(&self) -> Result<Vec<Contest>, CrawlerError>;
}

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
}

#[async_trait]
impl ProblemFetcher for CrawlerClient {
    async fn fetch_problems(&self, contest_id: &str) -> Result<Vec<Problem>, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/{}/tasks", contest_id);
        let request = self.client.get(&url);
        let response = request.send().await?;
        if response.status() == 404 {
            return Err(CrawlerError::NotFound);
        }
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let html = response.text().await?;
        parse_tasks_html(&html, contest_id)
    }
}

#[async_trait]
impl ContestFetcher for CrawlerClient {
    async fn fetch_contests(&self, page: u32) -> Result<Vec<Contest>, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/archive?lang=ja&page={}", page);
        let request = self.client.get(&url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let html = response.text().await?;
        parse_contests_archive_html(&html)
    }

    async fn fetch_contests_in_category(
        &self,
        page: u32,
        category: u32,
    ) -> Result<Vec<Contest>, CrawlerError> {
        let url = format!(
            "https://atcoder.jp/contests/archive?lang=ja&category={}&page={}",
            category, page
        );
        let request = self.client.get(&url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let html = response.text().await?;
        parse_contests_archive_html(&html)
    }

    async fn fetch_permanent_contests(&self) -> Result<Vec<Contest>, CrawlerError> {
        let url = "https://atcoder.jp/contests/?lang=ja";
        let request = self.client.get(url);
        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let html = response.text().await?;
        parse_permanent_contests_html(&html)
    }
}

impl CrawlerClient {
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

    pub async fn fetch_standings(&self, contest_id: &str) -> Result<Option<Value>, CrawlerError> {
        let url = format!("https://atcoder.jp/contests/{}/standings/json", contest_id);
        let request = self.client.get(&url);
        let response = request.send().await?;
        if response.status() == 404 {
            tracing::warn!("Standings for contest {} not found", contest_id);
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(CrawlerError::HttpError(response.text().await?));
        }
        let text = response.text().await?;
        let value: Value =
            serde_json::from_str(&text).map_err(|_| CrawlerError::JsonParseError { body: text })?;
        Ok(Some(value))
    }
}
