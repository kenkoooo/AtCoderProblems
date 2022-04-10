use actix_web::{post, web, HttpResponse, Responder, Result};
use serde::Deserialize;
use sql_client::{
    internal::virtual_contest_manager::{VirtualContestItem, VirtualContestManager},
    PgPool,
};

use crate::server::{error::ApiResult, middleware::github_auth::GithubToken};

#[derive(Deserialize)]
pub struct UpdateItemsQuery {
    contest_id: String,
    problems: Vec<VirtualContestItem>,
}

#[post("/internal-api/contest/item/update")]
pub async fn update_items(
    token: web::ReqData<GithubToken>,
    pool: web::Data<PgPool>,
    query: web::Json<UpdateItemsQuery>,
) -> Result<impl Responder> {
    let user_id = token.id.to_string();
    pool.update_items(&query.contest_id, &query.problems, &user_id)
        .await
        .map_internal_server_err()?;
    let response = HttpResponse::Ok().finish();
    Ok(response)
}
