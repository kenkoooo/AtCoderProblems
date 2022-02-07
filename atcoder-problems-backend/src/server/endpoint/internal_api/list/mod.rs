pub mod item;

use actix_web::{get, post, web, HttpResponse, Responder, Result};
use serde::Deserialize;
use sql_client::{internal::problem_list_manager::ProblemListManager, PgPool};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[get("/internal-api/list/get/{list_id}")]
pub async fn get_list(path: web::Path<String>, pool: web::Data<PgPool>) -> Result<impl Responder> {
    let list = pool
        .get_single_list(path.as_str())
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&list);
    Ok(response)
}
#[get("/internal-api/list/my")]
pub async fn get_my_list(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let user_id = token.id;
    let list = pool
        .get_list(&user_id.to_string())
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().json(&list);
    Ok(response)
}

#[derive(Deserialize)]
pub struct CreateListQuery {
    list_name: String,
}
#[post("/internal-api/list/create")]
pub async fn create_list(
    query: web::Json<CreateListQuery>,
    pool: web::Data<PgPool>,
    token: web::ReqData<GithubToken>,
) -> Result<impl Responder> {
    let user_id = token.id;
    let internal_list_id = pool
        .create_list(&user_id.to_string(), &query.list_name)
        .await
        .map_internal_server_err()?;
    let body = serde_json::json!({ "internal_list_id": internal_list_id });
    let response = HttpResponse::Ok().json(&body);
    Ok(response)
}

#[derive(Deserialize)]
pub struct DeleteListQuery {
    internal_list_id: String,
}

#[post("/internal-api/list/delete")]
pub async fn delete_list(
    query: web::Json<DeleteListQuery>,
    pool: web::Data<PgPool>,
    _: web::ReqData<GithubToken>,
) -> Result<impl Responder> {
    // TODO authorize
    pool.delete_list(&query.internal_list_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}
#[derive(Deserialize)]
pub struct UpdateListQuery {
    internal_list_id: String,
    name: String,
}

#[post("/internal-api/list/update")]
pub async fn update_list(
    query: web::Json<UpdateListQuery>,
    pool: web::Data<PgPool>,
    _: web::ReqData<GithubToken>,
) -> Result<HttpResponse> {
    // TODO authorize
    pool.update_list(&query.internal_list_id, &query.name)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}
