use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::server::{AppState, AuthedUser, ServerError, ServerResult};
use server_db::{
    self as db,
    virtual_contest::{VirtualContestInfo, VirtualContestItem},
};

/// Verify the contest exists and `user_id` is its owner.
/// Returns 404 if the contest does not exist, 403 if the caller is not the owner.
async fn ensure_contest_owner(
    state: &AppState,
    contest_id: &str,
    user_id: &str,
) -> ServerResult<()> {
    match db::virtual_contest::get_owner(&state.db, contest_id).await? {
        None => Err(ServerError::NotFound),
        Some(owner) if owner == user_id => Ok(()),
        Some(_) => Err(ServerError::Forbidden),
    }
}

#[derive(Deserialize)]
pub(crate) struct CreateContestQuery {
    title: String,
    memo: String,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<String>,
    is_public: Option<bool>,
    penalty_second: i64,
}

pub(crate) async fn create_contest(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<CreateContestQuery>,
) -> ServerResult<Json<Value>> {
    let contest_id = db::virtual_contest::create_contest(
        &state.db,
        &body.title,
        &body.memo,
        &gh.id.to_string(),
        body.start_epoch_second,
        body.duration_second,
        body.mode.as_deref(),
        body.is_public.unwrap_or(true),
        body.penalty_second,
    )
    .await?;
    Ok(Json(json!({ "contest_id": contest_id })))
}

#[derive(Deserialize)]
pub(crate) struct UpdateContestQuery {
    id: String,
    title: String,
    memo: String,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<String>,
    is_public: Option<bool>,
    penalty_second: i64,
}

pub(crate) async fn update_contest(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<UpdateContestQuery>,
) -> ServerResult<StatusCode> {
    ensure_contest_owner(&state, &body.id, &gh.id.to_string()).await?;
    let updated = db::virtual_contest::update_contest(
        &state.db,
        &body.id,
        &body.title,
        &body.memo,
        body.start_epoch_second,
        body.duration_second,
        body.mode.as_deref(),
        body.is_public.unwrap_or(true),
        body.penalty_second,
    )
    .await?;
    if !updated {
        return Err(ServerError::NotFound);
    }
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct UpdateItemsQuery {
    contest_id: String,
    problems: Vec<VirtualContestItem>,
}

pub(crate) async fn update_items(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<UpdateItemsQuery>,
) -> ServerResult<StatusCode> {
    ensure_contest_owner(&state, &body.contest_id, &gh.id.to_string()).await?;
    db::virtual_contest::update_items(&state.db, &body.contest_id, &body.problems).await?;
    Ok(StatusCode::OK)
}

#[derive(Serialize)]
pub(crate) struct VirtualContestDetails {
    info: VirtualContestInfo,
    problems: Vec<VirtualContestItem>,
    participants: Vec<String>,
}

pub(crate) async fn get_single_contest(
    State(state): State<AppState>,
    Path(contest_id): Path<String>,
) -> ServerResult<Json<VirtualContestDetails>> {
    let info = db::virtual_contest::get_single_info(&state.db, &contest_id)
        .await?
        .ok_or(ServerError::NotFound)?;
    let participants = db::virtual_contest::get_single_participants(&state.db, &contest_id).await?;
    let problems = db::virtual_contest::get_single_problems(&state.db, &contest_id).await?;
    Ok(Json(VirtualContestDetails {
        info,
        problems,
        participants,
    }))
}

#[derive(Deserialize)]
pub(crate) struct SingleContestQuery {
    contest_id: String,
}

pub(crate) async fn join_contest(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<SingleContestQuery>,
) -> ServerResult<StatusCode> {
    db::virtual_contest::join_contest(&state.db, &body.contest_id, &gh.id.to_string()).await?;
    Ok(StatusCode::OK)
}

pub(crate) async fn leave_contest(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<SingleContestQuery>,
) -> ServerResult<StatusCode> {
    db::virtual_contest::leave_contest(&state.db, &body.contest_id, &gh.id.to_string()).await?;
    Ok(StatusCode::OK)
}

pub(crate) async fn get_my_contests(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
) -> ServerResult<Json<Vec<VirtualContestInfo>>> {
    let contests = db::virtual_contest::get_own_contests(&state.db, &gh.id.to_string()).await?;
    Ok(Json(contests))
}

pub(crate) async fn get_participated(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
) -> ServerResult<Json<Vec<VirtualContestInfo>>> {
    let contests =
        db::virtual_contest::get_participated_contests(&state.db, &gh.id.to_string()).await?;
    Ok(Json(contests))
}

pub(crate) async fn get_recent_contests(
    State(state): State<AppState>,
) -> ServerResult<Json<Vec<VirtualContestInfo>>> {
    let contests = db::virtual_contest::get_recent_contests(&state.db).await?;
    Ok(Json(contests))
}
