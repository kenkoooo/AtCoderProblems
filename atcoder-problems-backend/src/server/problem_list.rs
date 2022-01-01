use crate::server::utils::GetAuthId;
use crate::server::{AppData, Authentication, CommonResponse};

use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::Deserialize;
use sql_client::internal::problem_list_manager::ProblemListManager;

pub(crate) async fn get_own_lists<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let list = conn
        .get_list(&user_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&list)?;
    Ok(response)
}

pub(crate) async fn get_single_list<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    list_id: web::Path<String>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let list = conn
        .get_single_list(&list_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&list)?;
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct CreateListQuery {
    list_name: String,
}

pub(crate) async fn create_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<CreateListQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let internal_list_id = conn
        .create_list(&user_id, &query.list_name)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let body = serde_json::json!({ "internal_list_id": internal_list_id });
    let response = HttpResponse::json(&body)?;
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct DeleteListQuery {
    internal_list_id: String,
}

pub(crate) async fn delete_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<DeleteListQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.delete_list(&query.internal_list_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct UpdateListQuery {
    internal_list_id: String,
    name: String,
}

pub(crate) async fn update_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<UpdateListQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.update_list(&query.internal_list_id, &query.name)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct AddItemQuery {
    internal_list_id: String,
    problem_id: String,
}

pub(crate) async fn add_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<AddItemQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.add_item(&query.internal_list_id, &query.problem_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct UpdateItemQuery {
    internal_list_id: String,
    problem_id: String,
    memo: String,
}

pub(crate) async fn update_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<UpdateItemQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.update_item(&query.internal_list_id, &query.problem_id, &query.memo)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct DeleteItemQuery {
    internal_list_id: String,
    problem_id: String,
}

pub(crate) async fn delete_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<DeleteItemQuery>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.delete_item(&query.internal_list_id, &query.problem_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::empty_json();
    Ok(response)
}
