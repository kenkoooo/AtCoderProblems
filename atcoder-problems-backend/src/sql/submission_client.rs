use crate::error::Result;
use crate::sql::models::Submission;
use crate::sql::schema::{submission_count, submissions};

use diesel::connection::SimpleConnection;
use diesel::dsl::insert_into;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::PgConnection;
use std::collections::BTreeMap;

pub enum SubmissionRequest<'a> {
    UserAll { user_id: &'a str },
    UsersAccepted { user_ids: &'a [&'a str] },
    FromTime { from_second: i64, count: i64 },
    RecentAccepted { count: i64 },
    RecentAll { count: i64 },
    InvalidResult { from_second: i64 },
    AllAccepted,
}

pub trait SubmissionClient {
    fn get_submissions(&self, request: SubmissionRequest) -> Result<Vec<Submission>>;
    fn get_user_submission_count(&self, user_id: &str) -> Result<i64>;
    fn get_submission_by_ids(&self, ids: &[i64]) -> Result<Vec<Submission>>;
    fn update_submissions(&self, values: &[Submission]) -> Result<usize>;
    fn update_submission_count(&self) -> Result<()>;
    fn update_delta_submission_count(&self, values: &[Submission]) -> Result<()>;

    fn count_stored_submissions(&self, ids: &[i64]) -> Result<usize> {
        let submissions = self.get_submission_by_ids(ids)?;
        Ok(submissions.len())
    }
}

impl SubmissionClient for PgConnection {
    fn get_submissions(&self, request: SubmissionRequest) -> Result<Vec<Submission>> {
        let submissions = match request {
            SubmissionRequest::UserAll { user_id } => submissions::table
                .filter(submissions::user_id.eq(user_id))
                .load(self),
            SubmissionRequest::FromTime { from_second, count } => submissions::table
                .filter(submissions::epoch_second.ge(from_second))
                .order_by(submissions::epoch_second.asc())
                .limit(count)
                .load(self),
            SubmissionRequest::RecentAccepted { count } => submissions::table
                .filter(submissions::result.eq("AC"))
                .order(submissions::id.desc())
                .limit(count)
                .load(self),
            SubmissionRequest::RecentAll { count } => submissions::table
                .order(submissions::id.desc())
                .limit(count)
                .load(self),
            SubmissionRequest::UsersAccepted { user_ids } => submissions::table
                .filter(submissions::result.eq("AC"))
                .filter(submissions::user_id.eq_any(user_ids))
                .load(self),
            SubmissionRequest::AllAccepted => submissions::table
                .filter(submissions::result.eq("AC"))
                .load(self),
            SubmissionRequest::InvalidResult { from_second } => submissions::table
                .filter(submissions::result.ne_all(&[
                    "AC", "WA", "TLE", "CE", "RE", "MLE", "OLE", "QLE", "IE", "NG",
                ]))
                .filter(submissions::epoch_second.ge(from_second))
                .order_by(submissions::id.desc())
                .load(self),
        }?;
        Ok(submissions)
    }

    fn get_user_submission_count(&self, user_id: &str) -> Result<i64> {
        let count = submission_count::table
            .filter(submission_count::user_id.eq(user_id))
            .select(submission_count::count)
            .first(self)?;
        Ok(count)
    }

    fn get_submission_by_ids(&self, ids: &[i64]) -> Result<Vec<Submission>> {
        let submissions: Vec<Submission> = submissions::table
            .filter(submissions::id.eq_any(ids))
            .load::<Submission>(self)?;
        Ok(submissions)
    }

    fn update_submissions(&self, values: &[Submission]) -> Result<usize> {
        let count = insert_into(submissions::table)
            .values(values)
            .on_conflict(submissions::id)
            .do_update()
            .set((
                submissions::user_id.eq(excluded(submissions::user_id)),
                submissions::result.eq(excluded(submissions::result)),
                submissions::point.eq(excluded(submissions::point)),
                submissions::execution_time.eq(excluded(submissions::execution_time)),
            ))
            .execute(self)?;
        Ok(count)
    }

    fn update_submission_count(&self) -> Result<()> {
        self.batch_execute(
            r"
            INSERT INTO submission_count (user_id, count)
            SELECT user_id, count(*) FROM submissions GROUP BY user_id
            ON CONFLICT (user_id) DO UPDATE SET count=EXCLUDED.count",
        )?;
        Ok(())
    }

    fn update_delta_submission_count(&self, values: &[Submission]) -> Result<()> {
        let count_map = values.iter().fold(BTreeMap::new(), |mut map, submission| {
            *map.entry(submission.user_id.as_str()).or_insert(0) += 1;
            map
        });
        let values = count_map
            .into_iter()
            .map(|(user_id, count)| {
                (
                    submission_count::user_id.eq(user_id),
                    submission_count::count.eq(count),
                )
            })
            .collect::<Vec<_>>();

        insert_into(submission_count::table)
            .values(values)
            .on_conflict(submission_count::user_id)
            .do_update()
            .set(submission_count::count.eq(excluded(submission_count::count)))
            .execute(self)?;
        Ok(())
    }
}
