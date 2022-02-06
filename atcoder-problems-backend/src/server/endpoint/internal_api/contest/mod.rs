pub mod item;

use actix_web::{get, post, web, HttpResponse, Responder, Result};
use serde::{Deserialize, Serialize};
use sql_client::{
    internal::virtual_contest_manager::{
        VirtualContestInfo, VirtualContestItem, VirtualContestManager,
    },
    PgPool,
};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[derive(Deserialize)]
pub struct CreateContestQuery {
    title: String,
    memo: String,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<String>,
    is_public: Option<bool>,
    penalty_second: i64,
}

#[post("/internal-api/contest/create")]
pub async fn create_contest(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<CreateContestQuery>,
) -> Result<impl Responder> {
    let user_id = token.id.to_string();
    let contest_id = pool
        .create_contest(
            &query.title,
            &query.memo,
            &user_id,
            query.start_epoch_second,
            query.duration_second,
            query.mode.as_deref(),
            query.is_public.unwrap_or(true),
            query.penalty_second,
        )
        .await
        .map_internal_server_err()?;
    let body = serde_json::json!({ "contest_id": contest_id });
    let response = HttpResponse::Ok().json(&body);
    Ok(response)
}

#[derive(Deserialize)]
pub struct UpdateContestQuery {
    id: String,
    title: String,
    memo: String,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<String>,
    is_public: Option<bool>,
    penalty_second: i64,
}

#[post("/internal-api/contest/update")]
pub async fn update_contest(
    _: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<UpdateContestQuery>,
) -> Result<impl Responder> {
    // TODO authorize
    pool.update_contest(
        &query.id,
        &query.title,
        &query.memo,
        query.start_epoch_second,
        query.duration_second,
        query.mode.as_deref(),
        query.is_public.unwrap_or(true),
        query.penalty_second,
    )
    .await
    .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}

#[get("/internal-api/contest/get/{contest_id}")]
pub async fn get_single_contest(
    pool: web::Data<PgPool>,
    contest_id: web::Path<String>,
) -> Result<HttpResponse> {
    #[derive(Serialize)]
    struct VirtualContestDetails {
        info: VirtualContestInfo,
        problems: Vec<VirtualContestItem>,
        participants: Vec<String>,
    }
    let info = pool
        .get_single_contest_info(&contest_id)
        .await
        .map_internal_server_err()?;
    let participants = pool
        .get_single_contest_participants(&contest_id)
        .await
        .map_internal_server_err()?;
    let problems = pool
        .get_single_contest_problems(&contest_id)
        .await
        .map_internal_server_err()?;
    let contest = VirtualContestDetails {
        info,
        problems,
        participants,
    };
    let response = HttpResponse::Ok().json(&contest);
    Ok(response)
}

#[derive(Deserialize)]
pub struct SingleContestQuery {
    contest_id: String,
}

#[post("/internal-api/contest/join")]
pub async fn join_contest(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<SingleContestQuery>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    pool.join_contest(&query.contest_id, &user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}

#[post("/internal-api/contest/leave")]
pub async fn leave_contest(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<SingleContestQuery>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    pool.leave_contest(&query.contest_id, &user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}

#[get("/internal-api/contest/my")]
pub async fn get_my_contests(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    let contests = pool
        .get_own_contests(&user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&contests);
    Ok(response)
}

#[get("/internal-api/contest/joined")]
pub async fn get_participated(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    let contests = pool
        .get_participated_contests(&user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&contests);
    Ok(response)
}

#[get("/internal-api/contest/recent")]
pub async fn get_recent_contests(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    let contest = pool
        .get_recent_contest_info()
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&contest);
    Ok(response)
}
