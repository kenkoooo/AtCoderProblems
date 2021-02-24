use crate::server::AppData;
use async_trait::async_trait;
use cookie::Cookie;
use serde::{Deserialize, Serialize};
use sql_client::internal::user_manager::UserManager;
use tide::http::headers::LOCATION;
use tide::StatusCode;
use tide::{Request, Response, Result};

#[async_trait]
pub trait Authentication {
    async fn get_token(&self, code: &str) -> Result<String>;
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse>;
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
    async fn get_token(&self, code: &str) -> Result<String> {
        let request = TokenRequest {
            client_id: self.client_id.to_owned(),
            client_secret: self.client_secret.to_owned(),
            code: code.to_owned(),
        };
        let response: TokenResponse = surf::post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .body(surf::Body::from_json(&request)?)
            .recv_json()
            .await?;
        Ok(response.access_token)
    }
    async fn get_user_id(&self, access_token: &str) -> Result<GitHubUserResponse> {
        let token_header = format!("token {}", access_token);
        let response: GitHubUserResponse = surf::get("https://api.github.com/user")
            .header("Authorization", token_header)
            .recv_json()
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
struct Query {
    code: String,
}

pub(crate) async fn get_token<A: Authentication + Clone>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    let query = request.query::<Query>()?;
    let client = request.state().authentication.clone();
    let conn = request.state().pg_pool.clone();

    let token = client.get_token(&query.code).await?;
    let response = client.get_user_id(&token).await?;
    let internal_user_id = response.id.to_string();
    conn.register_user(&internal_user_id).await?;

    let cookie = Cookie::build("token", token).path("/").finish();
    let redirect_url = "https://kenkoooo.com/atcoder/#/login/user";
    let mut response = Response::builder(StatusCode::Found)
        .header(LOCATION, redirect_url)
        .build();
    response.insert_cookie(cookie);
    Ok(response)
}
