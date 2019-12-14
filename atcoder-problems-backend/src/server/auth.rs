use crate::error::{Error, Result};
use crate::server::{AppData, CommonResponse};

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tide::{Request, Response};

#[async_trait]
pub trait Authentication {
    async fn get_token(&self, code: &str) -> Result<String>;
    async fn validate_token(&self, token: &str) -> bool;
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
    async fn validate_token(&self, access_token: &str) -> bool {
        surf::get("https://api.github.com/user")
            .set_header("Authorization", format!("token {}", access_token))
            .await
            .ok()
            .filter(|response| response.status().is_success())
            .is_some()
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

pub(crate) async fn get_token<A: Authentication + Clone>(request: Request<AppData<A>>) -> Response {
    let query = request.query::<Query>();
    match query {
        Err(_) => Response::bad_request(),
        Ok(Query { code }) => {
            let client = request.state().authentication.clone();
            let token = client.get_token(&code).await;
            match token {
                Err(_) => Response::internal_error(),
                Ok(token) => Response::new_cors(),
            }
        }
    }
}
pub(crate) async fn is_authorized<A: Authentication>(request: Request<A>) {}
