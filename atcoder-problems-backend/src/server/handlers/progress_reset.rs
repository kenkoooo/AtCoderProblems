use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;

use crate::server::{AppState, AuthedUser, ServerResult};
use server_db::{self as db, progress_reset::ProgressResetList};

pub(crate) async fn get_progress_reset_list(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
) -> ServerResult<Json<ProgressResetList>> {
    let list = db::progress_reset::get_list(&state.db, &gh.id.to_string()).await?;
    Ok(Json(list))
}

#[derive(Deserialize)]
pub(crate) struct AddItemQuery {
    problem_id: String,
    reset_epoch_second: i64,
}

pub(crate) async fn add_progress_reset_item(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<AddItemQuery>,
) -> ServerResult<StatusCode> {
    db::progress_reset::add_item(
        &state.db,
        &gh.id.to_string(),
        &body.problem_id,
        body.reset_epoch_second,
    )
    .await?;
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct DeleteItemQuery {
    problem_id: String,
}

pub(crate) async fn delete_progress_reset_item(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<DeleteItemQuery>,
) -> ServerResult<StatusCode> {
    db::progress_reset::remove_item(&state.db, &gh.id.to_string(), &body.problem_id).await?;
    Ok(StatusCode::OK)
}
