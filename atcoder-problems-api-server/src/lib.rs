pub mod api;
pub mod config;
pub mod sql;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
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

#[derive(Serialize, Deserialize, Debug)]
pub struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: usize,
    rated_point_sum: f64,
    rated_point_sum_rank: usize,
}
