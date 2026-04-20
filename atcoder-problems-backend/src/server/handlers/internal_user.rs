use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;

use crate::server::{AppState, AuthedUser, ServerError, ServerResult};
use server_db::{self as db, internal_user::InternalUserInfo};

pub(crate) async fn get_user(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
) -> ServerResult<Json<InternalUserInfo>> {
    let info = db::internal_user::get_user(&state.db, &gh.id.to_string())
        .await?
        .ok_or(ServerError::NotFound)?;
    Ok(Json(info))
}

#[derive(Deserialize)]
pub(crate) struct UpdateQuery {
    atcoder_user_id: String,
}

pub(crate) async fn update_user(
    State(state): State<AppState>,
    AuthedUser(gh): AuthedUser,
    Json(body): Json<UpdateQuery>,
) -> ServerResult<StatusCode> {
    db::internal_user::update_atcoder_user_id(&state.db, &gh.id.to_string(), &body.atcoder_user_id)
        .await?;
    Ok(StatusCode::OK)
}
