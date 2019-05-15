use diesel::sql_types::*;
use diesel::Queryable;
use serde::Serialize;

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct UserLanguageCount {
    pub user_id: String,
    #[serde(rename = "language")]
    simplified_language: String,

    #[serde(rename = "count")]
    problem_count: i32,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct UserProblemCount {
    pub user_id: String,
    problem_count: i32,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct Problem {
    pub id: String,
    contest_id: String,
    title: String,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct Contest {
    pub id: String,
    start_epoch_second: i64,
    duration_second: i64,
    title: String,
    rate_change: String,
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
