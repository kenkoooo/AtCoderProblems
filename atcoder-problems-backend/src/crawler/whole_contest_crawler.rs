use crate::crawler::AtCoderFetcher;
use anyhow::Result;

use log::info;
use sql_client::submission_client::SubmissionClient;
use std::{thread, time};

pub struct WholeContestCrawler<C, F> {
    db: C,
    fetcher: F,
    contest_id: String,
}

impl<C, F> WholeContestCrawler<C, F>
where
    C: SubmissionClient,
    F: AtCoderFetcher,
{
    pub fn new<S: ToString>(db: C, fetcher: F, contest_id: S) -> Self {
        Self {
            db,
            fetcher,
            contest_id: contest_id.to_string(),
        }
    }

    pub async fn crawl(&self) -> Result<()> {
        for page in 1.. {
            info!("Crawling {} {} ...", self.contest_id, page);
            let submissions = self.fetcher.fetch_submissions(&self.contest_id, page).await;
            if submissions.is_empty() {
                info!("Empty!");
                break;
            }

            self.db.update_submissions(&submissions).await?;
            thread::sleep(time::Duration::from_millis(200));
        }

        info!("Finished");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crawler::utils::MockFetcher;
    use async_std::task::block_on;
    use async_trait::async_trait;
    use sql_client::models::Submission;
    use sql_client::submission_client::SubmissionRequest;

    struct MockDB;

    #[async_trait]
    impl SubmissionClient for MockDB {
        async fn get_submissions<'a>(&self, _: SubmissionRequest<'a>) -> Result<Vec<Submission>> {
            unimplemented!()
        }

        async fn get_user_submission_count(&self, _: &str) -> Result<i64> {
            unimplemented!()
        }

        async fn update_submissions(&self, _: &[Submission]) -> Result<usize> {
            Ok(1)
        }

        async fn update_submission_count(&self) -> Result<()> {
            unimplemented!()
        }

        async fn update_user_submission_count(&self, _: &str) -> Result<()> {
            unimplemented!()
        }

        async fn update_delta_submission_count(&self, _: &[Submission]) -> Result<()> {
            unimplemented!()
        }

        async fn count_stored_submissions(&self, _: &[i64]) -> Result<usize> {
            unimplemented!()
        }
    }
    #[test]
    fn whole_contest_crawler() {
        let fetcher = MockFetcher(|_, page| {
            if page == 1 {
                vec![Submission {
                    ..Default::default()
                }]
            } else {
                vec![]
            }
        });
        let crawler = WholeContestCrawler::new(MockDB, fetcher, "contest-id");
        assert!(block_on(crawler.crawl()).is_ok());
    }
}
