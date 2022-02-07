use actix_web::{get, post, web, HttpResponse, Responder, Result};
use serde::Deserialize;
use sql_client::{internal::user_manager::UserManager, PgPool};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[get("/internal-api/user/get")]
pub async fn get(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let user_id = token.id.to_string();
    let info = pool
        .get_internal_user_info(&user_id)
        .await
        .map_internal_server_err()?;
    Ok(HttpResponse::Ok().json(&info))
}

#[derive(Deserialize)]
pub struct Query {
    atcoder_user_id: String,
}

#[post("/internal-api/user/update")]
pub async fn update(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    body: web::Json<Query>,
) -> Result<impl Responder> {
    let user_id = token.id.to_string();
    pool.update_internal_user_info(&user_id, &body.atcoder_user_id)
        .await
        .map_internal_server_err()?;
    Ok(HttpResponse::Ok().finish())
}
