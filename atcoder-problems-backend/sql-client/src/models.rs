use crate::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgRow;
use sqlx::FromRow;
use sqlx::Row;

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

impl FromRow<'_, PgRow> for Submission {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        let id: i64 = row.try_get("id")?;
        let epoch_second: i64 = row.try_get("epoch_second")?;
        let problem_id: String = row.try_get("problem_id")?;
        let contest_id: String = row.try_get("contest_id")?;
        let user_id: String = row.try_get("user_id")?;
        let language: String = row.try_get("language")?;
        let point: f64 = row.try_get("point")?;
        let length: i32 = row.try_get("length")?;
        let result: String = row.try_get("result")?;
        let execution_time: Option<i32> = row.try_get("execution_time")?;
        Ok(Submission {
            id,
            epoch_second,
            problem_id,
            contest_id,
            user_id,
            language,
            point,
            length,
            result,
            execution_time,
        })
    }
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

#[derive(Debug, Serialize)]
pub struct UserSum {
    pub user_id: String,
    pub point_sum: f64,
}

#[derive(PartialEq, Debug, Serialize)]
pub struct ContestProblem {
    pub contest_id: String,
    pub problem_id: String,
}

#[derive(PartialEq, Debug, Serialize)]
pub struct UserStreak {
    pub user_id: String,
    pub streak: i64,
}
