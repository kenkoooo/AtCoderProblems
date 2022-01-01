use crate::server::utils::GetAuthId;
use crate::server::{AppData, Authentication, CommonResponse};

use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sql_client::internal::virtual_contest_manager::{
    VirtualContestInfo, VirtualContestItem, VirtualContestManager,
};

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

pub(crate) async fn create_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<CreateContestQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let contest_id = conn
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
        .await.map_err(error::ErrorInternalServerError)?;
    let body = serde_json::json!({ "contest_id": contest_id });
    let response = HttpResponse::json(&body)?;
    Ok(response)
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

pub(crate) async fn update_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<UpdateContestQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.update_contest(
        &query.id,
        &query.title,
        &query.memo,
        query.start_epoch_second,
        query.duration_second,
        query.mode.as_deref(),
        query.is_public.unwrap_or(true),
        query.penalty_second,
    )
    .await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct UpdateItemsQuery {
    contest_id: String,
    problems: Vec<VirtualContestItem>,
}

pub(crate) async fn update_items<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<UpdateItemsQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.update_items(&query.contest_id, &query.problems, &user_id)
        .await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

pub(crate) async fn get_my_contests<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let contests = conn.get_own_contests(&user_id).await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&contests)?;
    Ok(response)
}

pub(crate) async fn get_participated<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let contests = conn.get_participated_contests(&user_id).await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&contests)?;
    Ok(response)
}

pub(crate) async fn get_single_contest<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    contest_id: web::Path<String>,
) -> Result<HttpResponse> {
    #[derive(Serialize)]
    struct VirtualContestDetails {
        info: VirtualContestInfo,
        problems: Vec<VirtualContestItem>,
        participants: Vec<String>,
    }

    let conn = data.pg_pool.clone();
    let info = conn.get_single_contest_info(&contest_id).await.map_err(error::ErrorInternalServerError)?;
    let participants = conn.get_single_contest_participants(&contest_id).await.map_err(error::ErrorInternalServerError)?;
    let problems = conn.get_single_contest_problems(&contest_id).await.map_err(error::ErrorInternalServerError)?;
    let contest = VirtualContestDetails {
        info,
        problems,
        participants,
    };
    let response = HttpResponse::json(&contest)?;
    Ok(response)
}

pub(crate) async fn get_recent_contests<A>(request: HttpRequest, data: web::Data<AppData<A>>) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let contest = conn.get_recent_contest_info().await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&contest)?;
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct SingleContestQuery {
    contest_id: String
}

pub(crate) async fn join_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<SingleContestQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.join_contest(&query.contest_id, &user_id).await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

pub(crate) async fn leave_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<SingleContestQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.leave_contest(&query.contest_id, &user_id).await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}
