use crate::server::{AppState, ServerResult};
use axum::{
    Json,
    extract::{Path, Query, State},
};
use serde::{Deserialize, Serialize};
use server_db::{self as db, submissions::Submission};

const USER_SUBMISSION_LIMIT: u64 = 500;
const RECENT_SUBMISSION_LIMIT: u64 = 1000;
const TIME_SUBMISSION_LIMIT: u64 = 1000;
const MULTI_SUBMISSION_LIMIT: u64 = 10000;
/// Maximum number of users/problems IDs accepted by `users_and_time`.
/// Guards against unbounded SQL bind parameter expansion.
const MULTI_QUERY_ID_LIMIT: usize = 1000;

#[derive(Debug, Deserialize)]
pub(crate) struct GetUserSubmissionQuery {
    user: String,
    from_second: Option<i64>,
    to_second: Option<i64>,
}

pub(crate) async fn get_user_submissions_from_time(
    State(state): State<AppState>,
    Query(q): Query<GetUserSubmissionQuery>,
) -> ServerResult<Json<Vec<Submission>>> {
    let from = q
        .from_second
        .ok_or_else(|| crate::server::ServerError::BadRequest("from_second required".into()))?;
    let subs =
        db::submissions::get_from_user_and_time(&state.db, &q.user, from, USER_SUBMISSION_LIMIT)
            .await?;
    Ok(Json(subs))
}

#[derive(Debug, Serialize)]
pub(crate) struct UserSubmissionCountResponse {
    pub(crate) count: u64,
}

pub(crate) async fn get_user_submission_count(
    State(state): State<AppState>,
    Query(q): Query<GetUserSubmissionQuery>,
) -> ServerResult<Json<UserSubmissionCountResponse>> {
    let from = q
        .from_second
        .ok_or_else(|| crate::server::ServerError::BadRequest("from_second required".into()))?;
    let to = q
        .to_second
        .ok_or_else(|| crate::server::ServerError::BadRequest("to_second required".into()))?;
    let count = db::submissions::count_user_submissions(&state.db, &q.user, from, to).await?;
    Ok(Json(UserSubmissionCountResponse { count }))
}

pub(crate) async fn get_time_submissions(
    State(state): State<AppState>,
    Path(from): Path<i64>,
) -> ServerResult<Json<Vec<Submission>>> {
    if from < 0 {
        return Err(crate::server::ServerError::BadRequest(
            "from must be non-negative".into(),
        ));
    }
    let subs = db::submissions::get_from_time(&state.db, from, TIME_SUBMISSION_LIMIT).await?;
    Ok(Json(subs))
}

pub(crate) async fn get_recent_submissions(
    State(state): State<AppState>,
) -> ServerResult<Json<Vec<Submission>>> {
    let subs = db::submissions::get_recent_all(&state.db, RECENT_SUBMISSION_LIMIT).await?;
    Ok(Json(subs))
}

#[derive(Debug, Deserialize)]
pub(crate) struct GetUsersTimeSubmissionQuery {
    users: String,
    problems: String,
    from: i64,
    to: i64,
}

pub(crate) async fn get_users_time_submissions(
    State(state): State<AppState>,
    Query(q): Query<GetUsersTimeSubmissionQuery>,
) -> ServerResult<Json<Vec<Submission>>> {
    if q.from > q.to {
        return Err(crate::server::ServerError::BadRequest(
            "from must be <= to".into(),
        ));
    }
    let user_ids: Vec<&str> = q
        .users
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    let problem_ids: Vec<&str> = q
        .problems
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    if user_ids.is_empty() || problem_ids.is_empty() {
        return Ok(Json(Vec::new()));
    }
    if user_ids.len() > MULTI_QUERY_ID_LIMIT || problem_ids.len() > MULTI_QUERY_ID_LIMIT {
        return Err(crate::server::ServerError::BadRequest(
            "too many ids".into(),
        ));
    }
    let subs = db::submissions::get_users_problems_time(
        &state.db,
        &user_ids,
        &problem_ids,
        q.from,
        q.to,
        MULTI_SUBMISSION_LIMIT,
    )
    .await?;
    Ok(Json(subs))
}
