use axum::{
    Json,
    extract::{Query, State},
};
use serde::{Deserialize, Serialize};

use crate::server::{AppState, ServerResult};
use server_db as db;

#[derive(Deserialize)]
pub(crate) struct UserInfoQuery {
    user: String,
}

#[derive(Serialize)]
pub(crate) struct UserInfo {
    pub(crate) user_id: String,
    pub(crate) accepted_count: i64,
    pub(crate) accepted_count_rank: i64,
    pub(crate) rated_point_sum: i64,
    pub(crate) rated_point_sum_rank: i64,
}

pub(crate) async fn get_user_info(
    State(state): State<AppState>,
    Query(q): Query<UserInfoQuery>,
) -> ServerResult<Json<UserInfo>> {
    let accepted_count = db::ranking::get_users_accepted_count(&state.db, &q.user)
        .await?
        .unwrap_or(0);
    let accepted_count_rank =
        db::ranking::get_accepted_count_rank(&state.db, accepted_count).await?;
    let rated_point_sum = db::ranking::get_users_rated_point_sum(&state.db, &q.user)
        .await?
        .unwrap_or(0);
    let rated_point_sum_rank =
        db::ranking::get_rated_point_sum_rank(&state.db, rated_point_sum).await?;
    Ok(Json(UserInfo {
        user_id: q.user,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    }))
}
