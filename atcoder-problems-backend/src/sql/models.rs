use super::schema::*;
use diesel::sql_types::*;
use diesel::Queryable;
use serde::Serialize;

const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
const UNRATED_STATE: &str = "-";

#[derive(Default, Debug, Eq, PartialEq, Queryable, Insertable, Serialize)]
pub struct Contest {
    pub id: String,
    pub start_epoch_second: i64,
    pub duration_second: i64,
    pub title: String,
    pub rate_change: String,
}

impl Contest {
    pub fn is_rated(&self) -> bool {
        self.start_epoch_second >= FIRST_AGC_EPOCH_SECOND && self.rate_change != UNRATED_STATE
    }
}

#[derive(Debug, Eq, PartialEq, Queryable, Insertable, Serialize)]
pub struct Problem {
    pub id: String,
    pub contest_id: String,
    pub title: String,
}

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}

#[derive(Debug, Queryable, Serialize)]
pub struct UserSum {
    pub user_id: String,
    pub point_sum: f64,
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

#[derive(PartialEq, Debug, Queryable, Serialize, Insertable)]
#[table_name = "contest_problem"]
pub struct ContestProblem {
    pub contest_id: String,
    pub problem_id: String,
}

#[derive(PartialEq, Debug, Queryable, Serialize, Insertable)]
#[table_name = "max_streaks"]
pub struct UserStreak {
    pub user_id: String,
    pub streak: i64,
}
