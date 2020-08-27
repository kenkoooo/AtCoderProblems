use crate::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Eq, PartialEq, Serialize)]
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

#[derive(Debug, Eq, PartialEq, Serialize)]
pub struct Problem {
    pub id: String,
    pub contest_id: String,
    pub title: String,
}

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
pub struct UserLanguageCount {
    pub user_id: String,

    #[serde(rename = "language")]
    pub simplified_language: String,

    #[serde(rename = "count")]
    pub problem_count: i32,
}

#[derive(Debug, Eq, PartialEq, Serialize)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}

#[derive(PartialEq, Debug, Serialize)]
pub struct ContestProblem {
    pub contest_id: String,
    pub problem_id: String,
}
