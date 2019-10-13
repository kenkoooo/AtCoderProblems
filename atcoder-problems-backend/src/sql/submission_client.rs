use crate::sql::models::Submission;
use crate::sql::schema::submissions;

use diesel::dsl::insert_into;
use diesel::expression::count::count_star;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};

pub enum SubmissionRequest<'a> {
    UserAll { user_id: &'a str },
    UsersAccepted { user_ids: &'a [&'a str] },
    FromTime { from_second: i64, count: i64 },
    RecentAccepted { count: i64 },
    RecentAll { count: i64 },
    AllAccepted,
}

pub trait SubmissionClient {
    fn get_submissions(&self, request: SubmissionRequest) -> QueryResult<Vec<Submission>>;
    fn get_user_submission_count(&self, user_id: &str) -> QueryResult<i64>;
    fn get_submission_by_id(&self, id: i64) -> QueryResult<Option<Submission>>;
    fn update_submissions(&self, values: &[Submission]) -> QueryResult<usize>;
}

impl SubmissionClient for PgConnection {
    fn get_submissions(&self, request: SubmissionRequest) -> QueryResult<Vec<Submission>> {
        match request {
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
        }
    }
    fn get_user_submission_count(&self, user_id: &str) -> QueryResult<i64> {
        submissions::table
            .filter(submissions::user_id.eq(user_id))
            .select(count_star())
            .first(self)
    }
    fn get_submission_by_id(&self, id: i64) -> QueryResult<Option<Submission>> {
        let submissions: Vec<Submission> = submissions::table
            .filter(submissions::id.eq(id))
            .load::<Submission>(self)?;
        Ok(submissions.into_iter().next())
    }

    fn update_submissions(&self, values: &[Submission]) -> QueryResult<usize> {
        insert_into(submissions::table)
            .values(values)
            .on_conflict(submissions::id)
            .do_update()
            .set((
                submissions::user_id.eq(excluded(submissions::user_id)),
                submissions::result.eq(excluded(submissions::result)),
                submissions::point.eq(excluded(submissions::point)),
                submissions::execution_time.eq(excluded(submissions::execution_time)),
            ))
            .execute(self)
    }
}
