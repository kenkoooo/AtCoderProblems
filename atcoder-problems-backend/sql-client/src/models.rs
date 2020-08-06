use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Default, Deserialize)]
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

#[derive(Debug, Eq, PartialEq, Serialize)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}
