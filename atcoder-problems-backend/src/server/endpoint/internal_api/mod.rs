pub mod contest;
pub mod list;
pub mod progress_reset;
pub mod user;

use actix_web::{cookie::Cookie, get, web, HttpResponse, Result};
use reqwest::header::LOCATION;
use serde::Deserialize;
use sql_client::{internal::user_manager::UserManager, PgPool};

use crate::server::{error::ApiResult, middleware::github_auth::GithubClient};

const REDIRECT_URL: &str = "https://kenkoooo.com/atcoder/";
#[derive(Deserialize)]
pub struct Query {
    code: String,
    redirect_to: Option<String>,
}

#[get("/internal-api/authorize")]
pub async fn get_authorize(
    client: web::Data<GithubClient>,
    query: web::Query<Query>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let token = client
        .authorize(&query.code)
        .await
        .map_internal_server_err()?;
    let user_id = client.verify_user(&token).await.map_internal_server_err()?;
    pool.register_user(&user_id.id.to_string())
        .await
        .map_internal_server_err()?;
    let cookie = Cookie::build("token", token).path("/").finish();
    let redirect_fragment = query
        .redirect_to
        .clone()
        .unwrap_or_else(|| "/login/user".to_string());
    let redirect_url = format!("{}#{}", REDIRECT_URL, redirect_fragment);
    let response = HttpResponse::Found()
        .insert_header((LOCATION, redirect_url))
        .cookie(cookie)
        .finish();
    Ok(response)
}
