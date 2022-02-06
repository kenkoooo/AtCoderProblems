use actix_web::{get, post, web, HttpResponse, Result};
use serde::Deserialize;
use sql_client::{internal::progress_reset_manager::ProgressResetManager, PgPool};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[get("/internal-api/progress_reset/list")]
pub async fn get_progress_reset_list(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    let list = pool
        .get_progress_reset_list(&user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&list);
    Ok(response)
}

#[derive(Deserialize)]
pub struct AddItemQuery {
    problem_id: String,
    reset_epoch_second: i64,
}

#[post("/internal-api/progress_reset/add")]
pub async fn add_progress_reset_item(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<AddItemQuery>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    pool.add_item(&user_id, &query.problem_id, query.reset_epoch_second)
        .await
        .map_internal_server_err()?;
    Ok(HttpResponse::Ok().finish())
}

#[derive(Deserialize)]
pub struct DeleteItemQuery {
    problem_id: String,
}

#[post("/internal-api/progress_reset/delete")]
pub async fn delete_progress_reset_item(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<DeleteItemQuery>,
) -> Result<HttpResponse> {
    let user_id = token.id.to_string();
    pool.remove_item(&user_id, &query.problem_id)
        .await
        .map_internal_server_err()?;
    Ok(HttpResponse::Ok().finish())
}
