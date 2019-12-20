use crate::crawler::SubmissionFetcher;
use crate::error::Result;
use crate::sql::SubmissionClient;

use log::info;

pub struct WholeContestCrawler<C, F> {
    db: C,
    fetcher: F,
    contest_id: String,
}

impl<C, F> WholeContestCrawler<C, F>
where
    C: SubmissionClient,
    F: SubmissionFetcher,
{
    pub fn new<S: ToString>(db: C, fetcher: F, contest_id: S) -> Self {
        Self {
            db,
            fetcher,
            contest_id: contest_id.to_string(),
        }
    }

    pub fn crawl(&self) -> Result<()> {
        for page in 1.. {
            info!("Crawling {} {} ...", self.contest_id, page);
            let submissions = self.fetcher.fetch_submissions(&self.contest_id, page);
            if submissions.is_empty() {
                info!("Empty!");
                break;
            }

            self.db.update_submissions(&submissions)?;
        }

        info!("Finished");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crawler::utils::MockFetcher;
    use crate::sql::models::Submission;
    use crate::sql::SubmissionRequest;

    struct MockDB;
    impl SubmissionClient for MockDB {
        fn get_submissions(&self, _: SubmissionRequest) -> Result<Vec<Submission>> {
            unimplemented!()
        }

        fn get_user_submission_count(&self, _: &str) -> Result<i64> {
            unimplemented!()
        }

        fn get_submission_by_ids(&self, _: &[i64]) -> Result<Vec<Submission>> {
            unimplemented!()
        }

        fn update_submissions(&self, _: &[Submission]) -> Result<usize> {
            Ok(1)
        }

        fn update_submission_count(&self) -> Result<()> {
            unimplemented!()
        }

        fn update_delta_submission_count(&self, values: &[Submission]) -> Result<()> {
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
        assert!(crawler.crawl().is_ok());
    }
}
