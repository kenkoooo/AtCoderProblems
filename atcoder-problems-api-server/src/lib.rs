pub mod api;
pub mod config;
pub mod sql;

use serde::Serialize;
#[derive(Serialize, Debug)]
pub struct Submission {
    id: i64,
    epoch_second: i64,
    problem_id: String,
    contest_id: String,
    user_id: String,
    language: String,
    point: f64,
    length: i32,
    result: String,
    execution_time: Option<i32>,
}

#[derive(Serialize, Debug)]
pub struct UserInfo {
    pub(crate) user_id: String,
    pub(crate) accepted_count: i32,
    pub(crate) accepted_count_rank: usize,
    pub(crate) rated_point_sum: f64,
    pub(crate) rated_point_sum_rank: usize,
}
