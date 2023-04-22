use std::sync::Arc;

use crate::util;
use anyhow::{Context, Result};

use super::*;

const ATCODER_PREFIX: &str = "https://atcoder.jp";

#[derive(Clone)]
pub struct AtCoderClient {
    client: Arc<reqwest::Client>,
}

impl AtCoderClient {
    pub async fn new(username: &str, password: &str) -> Result<Self> {
        let client = reqwest::Client::builder()
            .cookie_store(true)
            .gzip(true)
            .build()?;
        let response = client
            .get("https://atcoder.jp/login")
            .send()
            .await?
            .text()
            .await?;
        let csrf_token = extract_csrf_token(&response).context("no csrf token")?;
        let params = [
            ("username", username),
            ("password", password),
            ("csrf_token", &csrf_token),
        ];

        let response = client
            .post("https://atcoder.jp/login")
            .form(&params)
            .send()
            .await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!("AtCoder authentication failure"));
        }

        Ok(Self {
            client: Arc::new(client),
        })
    }

    pub async fn fetch_atcoder_contests(
        &self,
        spf: ContestTypeSpecifier,
    ) -> Result<Vec<AtCoderContest>> {
        match spf {
            ContestTypeSpecifier::Normal { page } => self.fetch_atcoder_normal_contests(page).await,
            ContestTypeSpecifier::Permanent => self.fetch_atcoder_permanent_contests().await,
            ContestTypeSpecifier::Hidden => self.fetch_atcoder_hidden_contests().await,
        }
    }

    async fn fetch_atcoder_normal_contests(&self, page: u32) -> Result<Vec<AtCoderContest>> {
        let url = format!("{}/contests/archive?lang=ja&page={}", ATCODER_PREFIX, page);
        let (html, _) = util::get_html(&url, &self.client).await?;
        contest::scrape_normal(&html)
    }

    async fn fetch_atcoder_permanent_contests(&self) -> Result<Vec<AtCoderContest>> {
        let url = format!("{}/contests/?lang=ja", ATCODER_PREFIX);
        let (html, _) = util::get_html(&url, &self.client).await?;
        contest::scrape_permanent(&html)
    }

    async fn fetch_atcoder_hidden_contests(&self) -> Result<Vec<AtCoderContest>> {
        let uri = "https://kenkoooo.com/atcoder/static_data/backend/hidden_contests.json";
        util::get_json(uri, &self.client).await
    }

    /// Fetch a list of submissions.
    pub async fn fetch_atcoder_submission_list(
        &self,
        contest_id: &str,
        page: Option<u32>,
    ) -> Result<AtCoderSubmissionListResponse> {
        let page = page.unwrap_or(1);
        let url = format!(
            "{}/contests/{}/submissions?page={}",
            ATCODER_PREFIX, contest_id, page
        );
        let (html, status) = util::get_html(&url, &self.client).await?;

        if status.is_success() {
            let submissions = submission::scrape(&html, contest_id)?;
            let max_page = submission::scrape_submission_page_count(&html)?;
            Ok(AtCoderSubmissionListResponse {
                max_page,
                submissions,
            })
        } else if status == reqwest::StatusCode::NOT_FOUND {
            log::warn!("404: {}", url);
            Ok(AtCoderSubmissionListResponse {
                max_page: 0,
                submissions: Vec::new(),
            })
        } else {
            Err(anyhow::anyhow!(
                "Failed to fetch {}: status={} body={}",
                url,
                status,
                html
            ))
        }
    }

    pub async fn fetch_problem_list(&self, contest_id: &str) -> Result<Vec<AtCoderProblem>> {
        let url = format!("{}/contests/{}/tasks", ATCODER_PREFIX, contest_id);
        let (html, _) = util::get_html(&url, &self.client).await?;
        problem::scrape(&html, contest_id)
    }
}

fn extract_csrf_token(response: &str) -> Option<String> {
    for line in response.split("\n") {
        let line = line.trim();
        if let Some(x) = line.strip_prefix("var csrfToken = ") {
            let token = x.trim().trim_matches(|c| c == '"');
            return Some(token.to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_contest_list() {
        let client = AtCoderClient {
            client: Arc::new(reqwest::Client::builder().build().unwrap()),
        };
        let contests = client
            .fetch_atcoder_contests(ContestTypeSpecifier::Normal { page: 1 })
            .await
            .unwrap();
        assert_eq!(contests.len(), 50);
    }

    #[tokio::test]
    async fn test_fetch_hidden_contest() {
        let client = AtCoderClient {
            client: Arc::new(reqwest::Client::builder().build().unwrap()),
        };
        let contests = client
            .fetch_atcoder_contests(ContestTypeSpecifier::Hidden)
            .await
            .unwrap();
        assert!(!contests.is_empty());
    }

    #[tokio::test]
    async fn test_fetch_problem_list() {
        let client = AtCoderClient {
            client: Arc::new(reqwest::Client::builder().build().unwrap()),
        };
        let problems = client.fetch_problem_list("abc107").await.unwrap();
        assert_eq!(problems.len(), 4);
    }
}
