use crate::server::utils::GetAuthId;
use crate::server::{AppData, Authentication, CommonResponse};
use serde::Deserialize;
use sql_client::internal::progress_reset_manager::ProgressResetManager;
use actix_web::{web, error, HttpResponse, HttpRequest, Result};

pub(crate) async fn get_progress_reset_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let list = conn.get_progress_reset_list(&user_id).await.map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&list)?;
    Ok(response)
}

#[derive(Deserialize)]
pub(crate) struct AddItemQuery {
    problem_id: String,
    reset_epoch_second: i64,
}

pub(crate) async fn add_progress_reset_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<AddItemQuery>
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.add_item(
        &user_id,
        &query.problem_id,
        query.reset_epoch_second,
    )
    .await.map_err(error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().finish())
}

#[derive(Deserialize)]
pub(crate) struct DeleteItemQuery {
    problem_id: String,
}

pub(crate) async fn delete_progress_reset_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Json<DeleteItemQuery>
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.remove_item(&user_id, &query.problem_id)
        .await.map_err(error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().finish())
}
