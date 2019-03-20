use super::schema::{contests, problems, submissions};

#[derive(Debug, Eq, PartialEq, Queryable, Insertable)]
pub struct Contest {
    pub id: String,
    pub start_epoch_second: i64,
    pub(crate) duration_second: i64,
    pub(crate) title: String,
    pub(crate) rate_change: String,
}

#[derive(Debug, Eq, PartialEq, Queryable, Insertable)]
pub struct Problem {
    pub(crate) id: String,
    pub contest_id: String,
    pub(crate) title: String,
}

#[derive(Debug, Queryable, Insertable)]
pub struct Submission {
    pub(crate) id: i64,
    pub(crate) epoch_second: i64,
    pub(crate) problem_id: String,
    pub(crate) contest_id: String,
    pub(crate) user_id: String,
    pub(crate) language: String,
    pub(crate) point: f64,
    pub(crate) length: i32,
    pub(crate) result: String,
    pub(crate) execution_time: Option<i32>,
}
