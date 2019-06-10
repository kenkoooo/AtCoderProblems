use super::schema::{contests, performances, problems, submissions};
use diesel::sql_types::*;
use diesel::Queryable;
use serde::Serialize;

#[derive(Debug, Eq, PartialEq, Queryable, Insertable, Serialize)]
pub struct Contest {
    pub id: String,
    pub start_epoch_second: i64,
    pub duration_second: i64,
    pub title: String,
    pub rate_change: String,
}

#[derive(Debug, Eq, PartialEq, Queryable, Insertable, Serialize)]
pub struct Problem {
    pub id: String,
    pub contest_id: String,
    pub title: String,
}

#[derive(Debug, Queryable, Insertable, Clone, Serialize, Default)]
pub struct Submission {
    pub id: i64,
    pub epoch_second: i64,
    pub problem_id: String,
    pub contest_id: String,
    pub user_id: String,
    pub language: String,
    pub point: f64,
    pub length: i32,
    pub result: String,
    pub execution_time: Option<i32>,
}

#[derive(Debug, Queryable, Insertable, Clone, Serialize)]
pub struct Performance {
    pub inner_performance: i64,
    pub contest_id: String,
    pub user_id: String,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct UserLanguageCount {
    pub user_id: String,

    #[serde(rename = "language")]
    pub simplified_language: String,

    #[serde(rename = "count")]
    pub problem_count: i32,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}

#[derive(Debug, Queryable, Serialize)]
pub struct UserSum {
    pub user_id: String,
    point_sum: f64,
}

#[derive(Debug, QueryableByName, Serialize)]
pub struct MergedProblem {
    #[sql_type = "Varchar"]
    pub id: String,
    #[sql_type = "Varchar"]
    contest_id: String,
    #[sql_type = "Varchar"]
    title: String,
    #[sql_type = "Nullable<Int8>"]
    shortest_submission_id: Option<i64>,
    #[sql_type = "Nullable<Varchar>"]
    shortest_problem_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    shortest_contest_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    shortest_user_id: Option<String>,
    #[sql_type = "Nullable<Int8>"]
    fastest_submission_id: Option<i64>,
    #[sql_type = "Nullable<Varchar>"]
    fastest_problem_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    fastest_contest_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    fastest_user_id: Option<String>,
    #[sql_type = "Nullable<Int8>"]
    first_submission_id: Option<i64>,
    #[sql_type = "Nullable<Varchar>"]
    first_problem_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    first_contest_id: Option<String>,
    #[sql_type = "Nullable<Varchar>"]
    first_user_id: Option<String>,
    #[sql_type = "Nullable<Int4>"]
    source_code_length: Option<i32>,
    #[sql_type = "Nullable<Int4>"]
    execution_time: Option<i32>,
    #[sql_type = "Nullable<Float8>"]
    point: Option<f64>,
    #[sql_type = "Nullable<Float8>"]
    predict: Option<f64>,
    #[sql_type = "Nullable<Int4>"]
    solver_count: Option<i32>,
}

#[derive(Debug, Queryable, Serialize)]
pub struct MinimumPerformance {
    problem_id: String,
    minimum_performance: i64,
}

#[derive(Debug, Queryable, Serialize)]
pub struct ContestProblem {
    contest_id: String,
    problem_id: String,
}
