use crate::server::AppData;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use sql_client::internal::user_manager::UserManager;
use actix_web::{error, web, HttpRequest, HttpResponse, Result, cookie::Cookie};
use actix_web::http::header::LOCATION;

const REDIRECT_URL: &str = "https://kenkoooo.com/atcoder/";

#[async_trait]
pub trait Authentication {
    async fn get_token(&self, code: &str) -> Result<String, reqwest::Error>;
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse, reqwest::Error>;
}

#[derive(Serialize)]
struct TokenRequest {
    client_id: String,
    client_secret: String,
    code: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(Deserialize, Default)]
pub struct GitHubUserResponse {
    pub(crate) id: i64,
    login: String,
}

#[derive(Clone)]
pub struct GitHubAuthentication {
    client_id: String,
    client_secret: String,
}

#[async_trait]
impl Authentication for GitHubAuthentication {
    async fn get_token(&self, code: &str) -> Result<String, reqwest::Error> {
        let request = TokenRequest {
            client_id: self.client_id.to_owned(),
            client_secret: self.client_secret.to_owned(),
            code: code.to_owned(),
        };
        let client = reqwest::Client::new();
        let response: TokenResponse = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .json(&request)
            .send()
            .await?
            .json()
            .await?;
        Ok(response.access_token)
    }
    async fn get_user_id(&self, access_token: &str) -> Result<GitHubUserResponse, reqwest::Error> {
        let token_header = format!("token {}", access_token);
        let client = reqwest::Client::new();
        let response: GitHubUserResponse = client
            .get("https://api.github.com/user")
            .header("Authorization", token_header)
            .send()
            .await?
            .json()
            .await?;
        Ok(response)
    }
}

impl GitHubAuthentication {
    pub fn new(client_id: &str, client_secret: &str) -> Self {
        Self {
            client_id: client_id.to_owned(),
            client_secret: client_secret.to_owned(),
        }
    }
}

#[derive(Deserialize)]
pub(crate) struct Query {
    code: String,
    redirect_to: Option<String>,
}

pub(crate) async fn get_token<A: Authentication + Clone>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<Query>
) -> Result<HttpResponse> {
    let client = data.authentication.clone();
    let conn = data.pg_pool.clone();

    let token = client.get_token(&query.code).await.map_err(error::ErrorInternalServerError)?;
    let response = client.get_user_id(&token).await.map_err(error::ErrorInternalServerError)?;
    let internal_user_id = response.id.to_string();
    conn.register_user(&internal_user_id).await.map_err(error::ErrorInternalServerError)?;

    let cookie = Cookie::build("token", token).path("/").finish();
    let redirect_fragment = query
        .redirect_to.clone()
        .unwrap_or_else(|| "/login/user".to_string());
    let redirect_url = format!("{}#{}", REDIRECT_URL, redirect_fragment);
    let response = HttpResponse::Found()
        .insert_header((LOCATION, redirect_url))
        .cookie(cookie)
        .finish();
    Ok(response)
}
