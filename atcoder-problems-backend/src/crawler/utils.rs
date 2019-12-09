use crate::crawler::SubmissionFetcher;
use crate::sql::models::Submission;

pub(crate) struct MockFetcher<F: Fn(&str, u32) -> Vec<Submission>>(pub(crate) F);

impl<F> SubmissionFetcher for MockFetcher<F>
where
    F: Fn(&str, u32) -> Vec<Submission>,
{
    fn fetch_submissions(&self, contest_id: &str, page: u32) -> Vec<Submission> {
        (self.0)(contest_id, page)
    }
}
