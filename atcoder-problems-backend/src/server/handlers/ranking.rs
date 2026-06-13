use axum::{
    Json,
    extract::{Query, State},
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};

use crate::server::{AppState, ServerError, ServerResult};
use server_db as db;

const MAX_RANKING_RANGE_LENGTH: u64 = 1_000;

#[derive(Deserialize)]
pub(crate) struct RankingQuery {
    from: i64,
    to: i64,
}

#[derive(Deserialize)]
pub(crate) struct LanguageRankingQuery {
    from: i64,
    to: i64,
    language: String,
}

#[derive(Deserialize)]
pub(crate) struct UserQuery {
    user: String,
}

#[derive(Serialize)]
pub(crate) struct RankingEntry {
    user_id: String,
    count: i64,
}

#[derive(Serialize)]
pub(crate) struct UserRankResponse {
    count: i64,
    rank: i64,
}

#[derive(Serialize)]
pub(crate) struct LanguageUserRankEntry {
    language: String,
    count: i64,
    rank: i64,
}

fn validate_range(from: i64, to: i64) -> Result<(u64, u64), ServerError> {
    if from < 0 || to < from {
        return Err(ServerError::BadRequest("invalid range".into()));
    }
    let offset = from as u64;
    let limit = (to - from) as u64;
    if limit > MAX_RANKING_RANGE_LENGTH {
        return Err(ServerError::BadRequest("range too large".into()));
    }
    Ok((offset, limit))
}

pub(crate) async fn get_ac_ranking(
    State(state): State<AppState>,
    Query(q): Query<RankingQuery>,
) -> ServerResult<Json<Vec<RankingEntry>>> {
    let (offset, limit) = validate_range(q.from, q.to)?;
    let rows = db::ranking::load_accepted_count_in_range(&state.db, offset, limit).await?;
    Ok(Json(
        rows.into_iter()
            .map(|e| RankingEntry {
                user_id: e.user_id,
                count: e.problem_count as i64,
            })
            .collect(),
    ))
}

pub(crate) async fn get_streak_ranking(
    State(state): State<AppState>,
    Query(q): Query<RankingQuery>,
) -> ServerResult<Json<Vec<RankingEntry>>> {
    let (offset, limit) = validate_range(q.from, q.to)?;
    let rows = db::ranking::load_streak_in_range(&state.db, offset, limit).await?;
    Ok(Json(
        rows.into_iter()
            .map(|e| RankingEntry {
                user_id: e.user_id,
                count: e.streak,
            })
            .collect(),
    ))
}

pub(crate) async fn get_rated_point_sum_ranking(
    State(state): State<AppState>,
    Query(q): Query<RankingQuery>,
) -> ServerResult<Json<Vec<RankingEntry>>> {
    let (offset, limit) = validate_range(q.from, q.to)?;
    let rows = db::ranking::load_rated_point_sum_in_range(&state.db, offset, limit).await?;
    Ok(Json(
        rows.into_iter()
            .map(|e| RankingEntry {
                user_id: e.user_id,
                count: e.point_sum,
            })
            .collect(),
    ))
}

pub(crate) async fn get_language_ranking(
    State(state): State<AppState>,
    Query(q): Query<LanguageRankingQuery>,
) -> ServerResult<Json<Vec<RankingEntry>>> {
    let (offset, limit) = validate_range(q.from, q.to)?;
    let rows =
        db::ranking::load_language_count_in_range(&state.db, &q.language, offset, limit).await?;
    Ok(Json(
        rows.into_iter()
            .map(|e| RankingEntry {
                user_id: e.user_id,
                count: e.problem_count as i64,
            })
            .collect(),
    ))
}

pub(crate) async fn get_user_ac_rank(
    State(state): State<AppState>,
    Query(q): Query<UserQuery>,
) -> ServerResult<Response> {
    let Some(count) = db::ranking::get_users_accepted_count(&state.db, &q.user).await? else {
        return Err(ServerError::NotFound);
    };
    let rank = db::ranking::get_accepted_count_rank(&state.db, count).await?;
    Ok(Json(UserRankResponse { count, rank }).into_response())
}

pub(crate) async fn get_user_streak_rank(
    State(state): State<AppState>,
    Query(q): Query<UserQuery>,
) -> ServerResult<Response> {
    let Some(count) = db::ranking::get_users_streak(&state.db, &q.user).await? else {
        return Err(ServerError::NotFound);
    };
    let rank = db::ranking::get_streak_rank(&state.db, count).await?;
    Ok(Json(UserRankResponse { count, rank }).into_response())
}

pub(crate) async fn get_user_rated_point_sum_rank(
    State(state): State<AppState>,
    Query(q): Query<UserQuery>,
) -> ServerResult<Response> {
    let Some(count) = db::ranking::get_users_rated_point_sum(&state.db, &q.user).await? else {
        return Err(ServerError::NotFound);
    };
    let rank = db::ranking::get_rated_point_sum_rank(&state.db, count).await?;
    Ok(Json(UserRankResponse { count, rank }).into_response())
}

pub(crate) async fn get_user_language_rank(
    State(state): State<AppState>,
    Query(q): Query<UserQuery>,
) -> ServerResult<Json<Vec<LanguageUserRankEntry>>> {
    let rows = db::ranking::load_users_language_rank(&state.db, &q.user).await?;
    let out: Vec<LanguageUserRankEntry> = rows
        .into_iter()
        .map(|r| LanguageUserRankEntry {
            language: r.simplified_language,
            count: r.problem_count as i64,
            rank: r.rank,
        })
        .collect();
    Ok(Json(out))
}
