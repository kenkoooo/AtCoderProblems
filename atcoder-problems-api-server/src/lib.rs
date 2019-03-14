pub mod config;
pub mod sql;

use serde::Serialize;
#[derive(Serialize, Debug)]
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

#[derive(Serialize, Debug)]
pub struct UserInfo {
    pub user_id: String,
    pub accepted_count: i32,
    pub accepted_count_rank: usize,
    pub rated_point_sum: f64,
    pub rated_point_sum_rank: usize,
}
