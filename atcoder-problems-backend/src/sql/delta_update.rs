use crate::sql::models::Submission;
use crate::sql::schema::*;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use regex::Regex;
use std::collections::{BTreeMap, BTreeSet};

pub trait DeltaUpdater {
    fn get_recent_submissions(&self, num: i64) -> QueryResult<Vec<Submission>>;
    fn get_user_submissions(&self, submissions: &[Submission]) -> QueryResult<Vec<Submission>>;
}

impl DeltaUpdater for PgConnection {
    fn get_recent_submissions(&self, num: i64) -> QueryResult<Vec<Submission>> {
        submissions::table
            .filter(submissions::result.eq("AC"))
            .order(submissions::id.desc())
            .limit(num)
            .load(self)
    }

    fn get_user_submissions(&self, submissions: &[Submission]) -> QueryResult<Vec<Submission>> {
        let users: BTreeSet<&str> = submissions.iter().map(|s| s.user_id.as_str()).collect();
        submissions::table
            .filter(submissions::result.eq("AC"))
            .filter(submissions::user_id.eq_any(users))
            .load(self)
    }
}
