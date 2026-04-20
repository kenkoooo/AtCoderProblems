use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::server::{AppState, AuthedUser, ServerError, ServerResult};
use server_db::{self as db, problem_list::ProblemList};

/// Verify the list exists and `user_id` is its owner.
/// Returns 404 if the list does not exist, 403 if the caller is not the owner.
async fn ensure_list_owner(state: &AppState, list_id: &str, user_id: &str) -> ServerResult<()> {
    match db::problem_list::get_owner(&state.db, list_id).await? {
        None => Err(ServerError::NotFound),
        Some(owner) if owner == user_id => Ok(()),
        Some(_) => Err(ServerError::Forbidden),
    }
}

pub(crate) async fn get_single_list(
    State(state): State<AppState>,
    Path(list_id): Path<String>,
) -> ServerResult<Json<ProblemList>> {
    let list = db::problem_list::get_single_list(&state.db, &list_id)
        .await?
        .ok_or(ServerError::NotFound)?;
    Ok(Json(list))
}

pub(crate) async fn get_my_list(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
) -> ServerResult<Json<Vec<ProblemList>>> {
    let lists = db::problem_list::get_user_lists(&state.db, &gh.id.to_string()).await?;
    Ok(Json(lists))
}

#[derive(Deserialize)]
pub(crate) struct CreateListQuery {
    list_name: String,
}

pub(crate) async fn create_list(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<CreateListQuery>,
) -> ServerResult<Json<Value>> {
    let internal_list_id =
        db::problem_list::create_list(&state.db, &gh.id.to_string(), &body.list_name).await?;
    Ok(Json(json!({ "internal_list_id": internal_list_id })))
}

#[derive(Deserialize)]
pub(crate) struct UpdateListQuery {
    internal_list_id: String,
    name: String,
}

pub(crate) async fn update_list(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<UpdateListQuery>,
) -> ServerResult<StatusCode> {
    ensure_list_owner(&state, &body.internal_list_id, &gh.id.to_string()).await?;
    let updated =
        db::problem_list::update_list(&state.db, &body.internal_list_id, &body.name).await?;
    if !updated {
        return Err(ServerError::NotFound);
    }
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct DeleteListQuery {
    internal_list_id: String,
}

pub(crate) async fn delete_list(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<DeleteListQuery>,
) -> ServerResult<StatusCode> {
    ensure_list_owner(&state, &body.internal_list_id, &gh.id.to_string()).await?;
    let deleted = db::problem_list::delete_list(&state.db, &body.internal_list_id).await?;
    if !deleted {
        return Err(ServerError::NotFound);
    }
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct AddItemQuery {
    internal_list_id: String,
    problem_id: String,
}

pub(crate) async fn add_item(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<AddItemQuery>,
) -> ServerResult<StatusCode> {
    ensure_list_owner(&state, &body.internal_list_id, &gh.id.to_string()).await?;
    db::problem_list::add_item(&state.db, &body.internal_list_id, &body.problem_id).await?;
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct UpdateItemQuery {
    internal_list_id: String,
    problem_id: String,
    memo: String,
}

pub(crate) async fn update_item(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<UpdateItemQuery>,
) -> ServerResult<StatusCode> {
    ensure_list_owner(&state, &body.internal_list_id, &gh.id.to_string()).await?;
    let updated = db::problem_list::update_item(
        &state.db,
        &body.internal_list_id,
        &body.problem_id,
        &body.memo,
    )
    .await?;
    if !updated {
        return Err(ServerError::NotFound);
    }
    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub(crate) struct DeleteItemQuery {
    internal_list_id: String,
    problem_id: String,
}

pub(crate) async fn delete_item(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<DeleteItemQuery>,
) -> ServerResult<StatusCode> {
    ensure_list_owner(&state, &body.internal_list_id, &gh.id.to_string()).await?;
    let deleted =
        db::problem_list::delete_item(&state.db, &body.internal_list_id, &body.problem_id).await?;
    if !deleted {
        return Err(ServerError::NotFound);
    }
    Ok(StatusCode::OK)
}
