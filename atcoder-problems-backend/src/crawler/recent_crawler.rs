use crate::crawler::SubmissionFetcher;
use crate::error::Result;
use crate::sql::{SimpleClient, SubmissionClient};

use log::info;
use std::{thread, time};

pub struct RecentCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> RecentCrawler<C, F>
where
    C: SubmissionClient + SimpleClient,
    F: SubmissionFetcher,
{
    pub fn new(db: C, fetcher: F) -> Self {
        Self { db, fetcher }
    }

    pub fn crawl(&self) -> Result<()> {
        info!("Started");
        let contests = self.db.load_contests()?;
        for contest in contests.into_iter() {
            for page in 1.. {
                info!("Crawling {}-{} ...", contest.id, page);
                let submissions = self.fetcher.fetch_submissions(&contest.id, page);
                if submissions.is_empty() {
                    info!("There is no submission on {}-{}", contest.id, page);
                    break;
                }

                let min_id = submissions.iter().map(|s| s.id).min().unwrap();
                let exists = self.db.count_stored_submissions(&[min_id])? != 0;
                self.db.update_submissions(&submissions)?;
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
    use crate::sql::models::{Contest, Problem, Submission};
    use crate::sql::SubmissionRequest;

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
        impl SubmissionClient for MockDB {
            fn get_submissions(&self, _: SubmissionRequest) -> Result<Vec<Submission>> {
                unimplemented!()
            }
            fn get_user_submission_count(&self, _: &str) -> Result<i64> {
                unimplemented!()
            }
            fn get_submission_by_ids(&self, ids: &[i64]) -> Result<Vec<Submission>> {
                assert_eq!(ids, &[0]);
                Ok(vec![Submission {
                    ..Default::default()
                }])
            }
            fn update_submissions(&self, submissions: &[Submission]) -> Result<usize> {
                assert_eq!(submissions.len(), 2);
                Ok(2)
            }
            fn update_submission_count(&self) -> Result<()> {
                unimplemented!()
            }

            fn update_delta_submission_count(&self, values: &[Submission]) -> Result<()> {
                unimplemented!()
            }
        }
        impl SimpleClient for MockDB {
            fn insert_contests(&self, _: &[Contest]) -> Result<usize> {
                unimplemented!()
            }
            fn insert_problems(&self, _: &[Problem]) -> Result<usize> {
                unimplemented!()
            }
            fn load_problems(&self) -> Result<Vec<Problem>> {
                unimplemented!()
            }
            fn load_contests(&self) -> Result<Vec<Contest>> {
                Ok(vec![Contest {
                    id: "contest".to_string(),
                    ..Default::default()
                }])
            }
        }

        let crawler = RecentCrawler::new(MockDB, fetcher);
        assert!(crawler.crawl().is_ok());
    }
}
