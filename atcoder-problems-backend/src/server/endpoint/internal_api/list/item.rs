use actix_web::{post, web, HttpResponse, Responder, Result};
use serde::Deserialize;
use sql_client::{internal::problem_list_manager::ProblemListManager, PgPool};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[derive(Deserialize)]
pub struct AddItemQuery {
    internal_list_id: String,
    problem_id: String,
}

#[post("/internal-api/list/item/add")]
pub async fn add_item(
    query: web::Json<AddItemQuery>,
    pool: web::Data<PgPool>,
    _: web::ReqData<GithubToken>,
) -> Result<impl Responder> {
    // TODO authorize
    pool.add_item(&query.internal_list_id, &query.problem_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}

#[derive(Deserialize)]
pub struct UpdateItemQuery {
    internal_list_id: String,
    problem_id: String,
    memo: String,
}

#[post("/internal-api/list/item/update")]
pub async fn update_item(
    query: web::Json<UpdateItemQuery>,
    pool: web::Data<PgPool>,
    _: web::ReqData<GithubToken>,
) -> Result<impl Responder> {
    // TODO authorize
    pool.update_item(&query.internal_list_id, &query.problem_id, &query.memo)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}

#[derive(Deserialize)]
pub struct DeleteItemQuery {
    internal_list_id: String,
    problem_id: String,
}

#[post("/internal-api/list/item/delete")]
pub async fn delete_item(
    query: web::Json<DeleteItemQuery>,
    pool: web::Data<PgPool>,
    _: web::ReqData<GithubToken>,
) -> Result<impl Responder> {
    // TODO authorize
    pool.delete_item(&query.internal_list_id, &query.problem_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}
