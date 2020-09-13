use crate::crawler::AtCoderFetcher;
use anyhow::Result;
use log::info;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use std::collections::BTreeMap;

pub struct FixCrawler<C, F> {
    pool: C,
    fetcher: F,
    current_time_second: i64,
}

impl<C, F> FixCrawler<C, F>
where
    C: SubmissionClient,
    F: AtCoderFetcher,
{
    pub fn new(pool: C, fetcher: F, current_time_second: i64) -> Self {
        Self {
            pool,
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
            .pool
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
                self.pool.update_submissions(&submissions).await?;
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
    use async_std::task::block_on;
    const CURRENT_TIME: i64 = 100;

    struct MockDB;
    impl SubmissionClient for MockDB {
        fn get_submissions(&self, request: SubmissionRequest) -> Result<Vec<Submission>> {
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
        fn get_user_submission_count(&self, _: &str) -> Result<i64> {
            unimplemented!()
        }
        fn update_submissions(&self, _: &[Submission]) -> Result<usize> {
            Ok(0)
        }
        fn update_submission_count(&self) -> Result<()> {
            unimplemented!()
        }
        fn update_user_submission_count(&self, _: &str) -> Result<()> {
            unimplemented!()
        }
        fn update_delta_submission_count(&self, _: &[Submission]) -> Result<()> {
            unimplemented!()
        }
    }

    use super::*;
    use crate::crawler::utils::MockFetcher;
    use crate::sql::models::Submission;

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
