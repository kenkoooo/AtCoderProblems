use crate::crawler::AtCoderFetcher;
use anyhow::Result;
use log::info;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use std::collections::BTreeMap;

pub struct FixCrawler<C, F> {
    db: C,
    fetcher: F,
    current_time_second: i64,
}

impl<C, F> FixCrawler<C, F>
where
    C: SubmissionClient,
    F: AtCoderFetcher,
{
    pub fn new(db: C, fetcher: F, current_time_second: i64) -> Self {
        Self {
            db,
            fetcher,
            current_time_second,
        }
    }
    pub async fn crawl(&self) -> Result<()> {
        info!(
            "Pulling invalid submissions after {} ...",
            self.current_time_second
        );
        let submissions = self
            .db
            .get_submissions(SubmissionRequest::InvalidResult {
                from_second: self.current_time_second,
            })
            .await?;

        info!("There are {} invalid submissions.", submissions.len());
        let contests = submissions.into_iter().map(|s| (s.contest_id, s.id)).fold(
            BTreeMap::new(),
            |mut map, (contest_id, id)| {
                let cur_id = map.entry(contest_id).or_insert(id);
                if *cur_id > id {
                    *cur_id = id;
                }
                map
            },
        );

        for (contest_id, minimum_id) in contests.into_iter() {
            for page in 1.. {
                info!("Fetching from {}-{}", contest_id, page);
                let submissions = self.fetcher.fetch_submissions(&contest_id, page).await;
                self.db.update_submissions(&submissions).await?;
                let all_old = submissions.iter().all(|s| s.id <= minimum_id);
                if all_old {
                    break;
                }
            }
        }

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

    const CURRENT_TIME: i64 = 100;

    struct MockDB;

    #[async_trait]
    impl SubmissionClient for MockDB {
        async fn get_submissions<'a>(
            &self,
            request: SubmissionRequest<'a>,
        ) -> Result<Vec<Submission>> {
            match request {
                SubmissionRequest::InvalidResult { from_second } => {
                    assert_eq!(from_second, CURRENT_TIME);
                    Ok(vec![
                        Submission {
                            contest_id: "contest1".to_string(),
                            id: 100,
                            ..Default::default()
                        },
                        Submission {
                            contest_id: "contest1".to_string(),
                            id: 200,
                            ..Default::default()
                        },
                        Submission {
                            contest_id: "contest1".to_string(),
                            id: 50,
                            ..Default::default()
                        },
                    ])
                }
                _ => unreachable!(),
            }
        }
        async fn get_user_submission_count(&self, _: &str) -> Result<i64> {
            unimplemented!()
        }
        async fn update_submissions(&self, _: &[Submission]) -> Result<usize> {
            Ok(0)
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

    #[test]
    fn test_fix_crawler_found() {
        let fetcher = MockFetcher(|_, _| {
            vec![Submission {
                id: 50,
                ..Default::default()
            }]
        });
        let crawler = FixCrawler::new(MockDB, fetcher, CURRENT_TIME);
        assert!(block_on(crawler.crawl()).is_ok());
    }

    #[test]
    fn test_fix_crawler_all_old() {
        let fetcher = MockFetcher(|_, _| {
            vec![Submission {
                id: 30,
                ..Default::default()
            }]
        });

        let crawler = FixCrawler::new(MockDB, fetcher, CURRENT_TIME);
        assert!(block_on(crawler.crawl()).is_ok());
    }
}
