use crate::crawler::AtCoderFetcher;
use anyhow::Result;

use log::info;
use sql_client::simple_client::SimpleClient;
use sql_client::submission_client::SubmissionClient;
use std::{thread, time};

pub struct RecentCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> RecentCrawler<C, F>
where
    C: SubmissionClient + SimpleClient + Sync,
    F: AtCoderFetcher,
{
    pub fn new(db: C, fetcher: F) -> Self {
        Self { db, fetcher }
    }

    pub async fn crawl(&self) -> Result<()> {
        info!("Started");
        let contests = self.db.load_contests().await?;
        for contest in contests.into_iter() {
            for page in 1.. {
                info!("Crawling {}-{} ...", contest.id, page);
                let submissions = self.fetcher.fetch_submissions(&contest.id, page).await;
                if submissions.is_empty() {
                    info!("There is no submission on {}-{}", contest.id, page);
                    break;
                }

                let min_id = submissions.iter().map(|s| s.id).min().unwrap();
                let exists = self.db.count_stored_submissions(&[min_id]).await? != 0;
                self.db.update_submissions(&submissions).await?;
                thread::sleep(time::Duration::from_millis(200));

                if exists {
                    info!("Finished crawling {}", contest.id);
                    break;
                }
            }
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
    use sql_client::models::{Contest, Problem, Submission};
    use sql_client::submission_client::SubmissionRequest;

    #[test]
    fn test_recent_crawler() {
        let fetcher = MockFetcher(|contest_id: &str, page: u32| {
            assert_eq!(contest_id, "contest");
            assert_eq!(page, 1);
            vec![
                Submission {
                    id: 0,
                    ..Default::default()
                },
                Submission {
                    id: 1,
                    ..Default::default()
                },
            ]
        });

        struct MockDB;
        #[async_trait]
        impl SubmissionClient for MockDB {
            async fn get_submissions<'a>(
                &self,
                request: SubmissionRequest<'a>,
            ) -> Result<Vec<Submission>> {
                match request {
                    SubmissionRequest::ByIds { ids } => {
                        assert_eq!(ids, &[0]);
                        Ok(vec![Submission {
                            ..Default::default()
                        }])
                    }
                    _ => unimplemented!(),
                }
            }
            async fn get_user_submission_count(&self, _: &str) -> Result<i64> {
                unimplemented!()
            }

            async fn update_submissions(&self, submissions: &[Submission]) -> Result<usize> {
                assert_eq!(submissions.len(), 2);
                Ok(2)
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
        }
        #[async_trait]
        impl SimpleClient for MockDB {
            async fn insert_contests(&self, _: &[Contest]) -> Result<usize> {
                unimplemented!()
            }
            async fn insert_problems(&self, _: &[Problem]) -> Result<usize> {
                unimplemented!()
            }
            async fn load_problems(&self) -> Result<Vec<Problem>> {
                unimplemented!()
            }
            async fn load_contests(&self) -> Result<Vec<Contest>> {
                Ok(vec![Contest {
                    id: "contest".to_string(),
                    ..Default::default()
                }])
            }
        }

        let crawler = RecentCrawler::new(MockDB, fetcher);
        assert!(block_on(crawler.crawl()).is_ok());
    }
}
