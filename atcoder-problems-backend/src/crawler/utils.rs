use crate::crawler::AtCoderFetcher;
use crate::sql::models::Submission;
use anyhow::Result;
use async_trait::async_trait;
use sql_client::models::{Contest, ContestProblem, Problem};

pub(crate) struct MockFetcher<F: Fn(&str, u32) -> Vec<Submission>>(pub(crate) F);

#[async_trait]
impl<F> AtCoderFetcher for MockFetcher<F>
where
    F: Fn(&str, u32) -> Vec<Submission> + Send + Sync,
{
    async fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission> {
        (self.0)(contest_id, page)
    }

    async fn fetch_contests(&self, _: u32) -> Result<Vec<Contest>> {
        unimplemented!()
    }

    async fn fetch_problems(&self, _: &str) -> Result<(Vec<Problem>, Vec<ContestProblem>)> {
        unimplemented!()
    }
}
