use actix_web::{error, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[async_trait(?Send)]
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
}

#[derive(Clone)]
pub struct GitHubAuthentication {
    client_id: String,
    client_secret: String,
}

#[async_trait(?Send)]
impl Authentication for GitHubAuthentication {
    async fn get_token(&self, code: &str) -> Result<String> {
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
            .await
            .map_err(error::ErrorInternalServerError)?
            .json()
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(response.access_token)
    }
    async fn get_user_id(&self, access_token: &str) -> Result<GitHubUserResponse> {
        let token_header = format!("token {}", access_token);
        let client = reqwest::Client::builder()
            .user_agent("AtCoder Problems")
            .build()
            .map_err(error::ErrorInternalServerError)?;
        let response: GitHubUserResponse = client
            .get("https://api.github.com/user")
            .header("Authorization", token_header)
            .send()
            .await
            .map_err(error::ErrorInternalServerError)?
            .json()
            .await
            .map_err(error::ErrorInternalServerError)?;
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
