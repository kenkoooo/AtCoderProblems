use crate::error::Result;
use crate::server::{AppData, CommonResponse, PooledConnection};

use crate::sql::internal::user_manager::UserManager;
use async_trait::async_trait;
use cookie::Cookie;
use serde::{Deserialize, Serialize};
use tide::{Request, Response};

#[async_trait]
pub trait Authentication {
    async fn get_token(&self, code: &str) -> Result<String>;
    async fn get_user_id(&self, token: &str) -> Result<String>;
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

#[derive(Deserialize)]
struct GitHubUserResponse {
    id: i64,
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
            .set_header("Accept", "application/json")
            .body_json(&request)?
            .recv_json()
            .await?;
        Ok(response.access_token)
    }
    async fn get_user_id(&self, access_token: &str) -> Result<String> {
        let response: GitHubUserResponse = surf::get("https://api.github.com/user")
            .set_header("Authorization", format!("token {}", access_token))
            .recv_json()
            .await?;
        Ok(response.id.to_string())
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

#[derive(Serialize)]
struct AuthorizeResponse {
    internal_user_id: String,
}

pub(crate) async fn get_token<A: Authentication + Clone>(request: Request<AppData<A>>) -> Response {
    fn unpack_request<A: Authentication + Clone>(
        request: Request<AppData<A>>,
    ) -> Result<(Query, A, PooledConnection)> {
        let query = request.query::<Query>()?;
        let client = request.state().authentication.clone();
        let conn = request.state().pool.get()?;
        Ok((query, client, conn))
    }

    async fn create_response<A: Authentication + Clone>(
        client: A,
        code: String,
        conn: PooledConnection,
    ) -> Result<Response> {
        let token = client.get_token(&code).await?;
        let internal_user_id = client.get_user_id(&token).await?;
        conn.register_user(&internal_user_id)?;
        let cookie = Cookie::build("token", token).path("/").finish();
        let response = AuthorizeResponse { internal_user_id };
        let response = Response::ok().set_cookie(cookie).body_json(&response)?;
        Ok(response)
    }

    match unpack_request(request) {
        Ok((query, client, conn)) => match create_response(client, query.code, conn).await {
            Ok(response) => response,
            _ => Response::bad_request(),
        },
        _ => Response::bad_request(),
    }
}
