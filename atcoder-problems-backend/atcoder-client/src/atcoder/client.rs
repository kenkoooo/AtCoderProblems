use crate::util;
use anyhow::Result;

use super::*;
use surf::StatusCode;

const ATCODER_PREFIX: &str = "https://atcoder.jp";

pub struct AtCoderClient;

impl Default for AtCoderClient {
    fn default() -> Self {
        Self
    }
}

impl AtCoderClient {
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
        let (html, _) = util::get_html(&url).await?;
        contest::scrape_normal(&html)
    }

    async fn fetch_atcoder_permanent_contests(&self) -> Result<Vec<AtCoderContest>> {
        let url = format!("{}/contests/?lang=ja", ATCODER_PREFIX);
        let (html, _) = util::get_html(&url).await?;
        contest::scrape_permanent(&html)
    }

    async fn fetch_atcoder_hidden_contests(&self) -> Result<Vec<AtCoderContest>> {
        let uri = "https://kenkoooo.com/atcoder/static_data/backend/hidden_contests.json";
        util::get_json(&uri).await
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
        let (html, status) = util::get_html(&url).await?;

        if status.is_success() {
            let submissions = submission::scrape(&html, contest_id)?;
            let max_page = submission::scrape_submission_page_count(&html)?;
            Ok(AtCoderSubmissionListResponse {
                max_page,
                submissions,
            })
        } else if status == StatusCode::NotFound {
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
        let (html, _) = util::get_html(&url).await?;
        problem::scrape(&html, contest_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::executor::block_on;

    #[test]
    fn test_fetch_contest_list() {
        let client = AtCoderClient::default();
        let contests =
            block_on(client.fetch_atcoder_contests(ContestTypeSpecifier::Normal { page: 1 }))
                .unwrap();
        assert_eq!(contests.len(), 50);
    }

    #[test]
    fn test_fetch_hidden_contest() {
        let client = AtCoderClient::default();
        let contests =
            block_on(client.fetch_atcoder_contests(ContestTypeSpecifier::Hidden)).unwrap();
        assert!(contests.len() >= 1);
    }

    #[test]
    fn test_fetch_problem_list() {
        let client = AtCoderClient::default();
        let problems = block_on(client.fetch_problem_list("abc107")).unwrap();
        assert_eq!(problems.len(), 4);
    }

    #[test]
    fn test_fetch_submission_list() {
        let client = AtCoderClient::default();
        let response = block_on(client.fetch_atcoder_submission_list("xmascon17", None)).unwrap();
        assert_eq!(response.submissions.len(), 20);

        let response =
            block_on(client.fetch_atcoder_submission_list("xmascon17", Some(response.max_page)))
                .unwrap();
        assert!(!response.submissions.is_empty());

        let response = block_on(
            client.fetch_atcoder_submission_list("xmascon17", Some(response.max_page + 1)),
        );
        assert!(response.is_err());
    }
}
