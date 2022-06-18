use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Eq, PartialEq, Serialize, sqlx::FromRow)]
pub struct Contest {
    pub id: String,
    pub start_epoch_second: i64,
    pub duration_second: i64,
    pub title: String,
    pub rate_change: String,
}

#[derive(Debug, Eq, PartialEq, Serialize, sqlx::FromRow)]
pub struct Problem {
    pub id: String,
    pub contest_id: String,
    pub problem_index: String,
    pub name: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Default, Deserialize, sqlx::FromRow)]
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

#[derive(Debug, Eq, PartialEq, Serialize, sqlx::FromRow)]
pub struct UserLanguageCount {
    pub user_id: String,

    #[serde(rename = "language")]
    pub simplified_language: String,

    #[serde(rename = "count")]
    pub problem_count: i32,
}

#[derive(Debug, Eq, PartialEq, Serialize, sqlx::FromRow)]
pub struct UserLanguageCountRank {
    pub user_id: String,

    #[serde(rename = "language")]
    pub simplified_language: String,

    pub rank: i64,
}

#[derive(Debug, Eq, PartialEq, Serialize, sqlx::FromRow)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UserSum {
    pub user_id: String,
    pub point_sum: i64,
}

#[derive(PartialEq, Debug, Serialize, sqlx::FromRow)]
pub struct ContestProblem {
    pub contest_id: String,
    pub problem_id: String,
    pub problem_index: String,
}

#[derive(PartialEq, Debug, Serialize, sqlx::FromRow)]
pub struct UserStreak {
    pub user_id: String,
    pub streak: i64,
}
