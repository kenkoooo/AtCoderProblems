use crate::server::utils::GetAuthId;
use crate::server::{AppData, Authentication, CommonResponse};
use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::Deserialize;
use sql_client::internal::user_manager::UserManager;

#[derive(Deserialize)]
pub(crate) struct Query {
    atcoder_user_id: String,
}

pub(crate) async fn update<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    body: web::Json<Query>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    conn.update_internal_user_info(&user_id, &body.atcoder_user_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    Ok(HttpResponse::empty_json())
}

pub(crate) async fn get<A: Authentication + Clone + Send + Sync + 'static>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let user_id = data.get_authorized_id(request.cookie("token")).await?;
    let conn = data.pg_pool.clone();
    let info = conn
        .get_internal_user_info(&user_id)
        .await
        .map_err(error::ErrorInternalServerError)?;
    Ok(HttpResponse::json(&info)?)
}
