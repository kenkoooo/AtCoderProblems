use crate::error::Result;

use serde::{Deserialize, Serialize};

pub(crate) trait Authentication {
    async fn get_token(&self, code: &str) -> Result<String>;
    async fn is_valid_token(&self, token: &str) -> bool;
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

pub(crate) struct GitHubAuthentication {
    client_id: String,
    client_secret: String,
}

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
    async fn is_valid_token(&self, access_token: &str) -> bool {
        surf::get("https://api.github.com/user")
            .set_header("Authorization", format!("token {}", access_token))
            .await
            .ok()
            .filter(|response| response.status().is_success())
            .is_some()
    }
}

impl GitHubAuthentication {
    pub(crate) fn new(client_id: &str, client_secret: &str) -> Self {
        Self {
            client_id: client_id.to_owned(),
            client_secret: client_secret.to_owned(),
        }
    }
}
