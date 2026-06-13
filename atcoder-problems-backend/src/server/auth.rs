use async_trait::async_trait;
use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use axum_extra::extract::CookieJar;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::AppState;

#[derive(Deserialize, Serialize, Clone, Debug, PartialEq, Eq)]
pub struct GithubToken {
    pub id: i64,
}

#[derive(thiserror::Error, Debug)]
pub enum AuthError {
    #[error("network error: {0}")]
    Network(String),

    #[error("invalid github response")]
    InvalidResponse,
}

#[async_trait]
pub trait GithubAuthenticator: Send + Sync + 'static {
    async fn authorize(&self, code: &str) -> Result<String, AuthError>;
    async fn verify_user(&self, access_token: &str) -> Result<GithubToken, AuthError>;
}

#[derive(Clone)]
pub struct GithubClient {
    client: Client,
    client_id: String,
    client_secret: String,
    base_url: String,
    api_base_url: String,
}

impl GithubClient {
    pub fn new(
        client_id: &str,
        client_secret: &str,
        base_url: &str,
        api_base_url: &str,
    ) -> Result<Self, AuthError> {
        let client = Client::builder()
            .user_agent("AtCoder Problems")
            // Prevent a slow or stuck GitHub response from pinning a tokio worker
            // for every authenticated request.
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| AuthError::Network(e.to_string()))?;
        Ok(Self {
            client,
            client_id: client_id.to_string(),
            client_secret: client_secret.to_string(),
            base_url: base_url.to_string(),
            api_base_url: api_base_url.to_string(),
        })
    }
}

#[async_trait]
impl GithubAuthenticator for GithubClient {
    async fn authorize(&self, code: &str) -> Result<String, AuthError> {
        let url = format!("{}/login/oauth/access_token", self.base_url);
        let request = json!({
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
        });
        let response = self
            .client
            .post(url)
            .header("Accept", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| AuthError::Network(e.to_string()))?;
        if !response.status().is_success() {
            return Err(AuthError::InvalidResponse);
        }
        let body: Value = response
            .json()
            .await
            .map_err(|e| AuthError::Network(e.to_string()))?;
        body["access_token"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or(AuthError::InvalidResponse)
    }

    async fn verify_user(&self, access_token: &str) -> Result<GithubToken, AuthError> {
        let url = format!("{}/user", self.api_base_url);
        let token_header = format!("token {}", access_token);
        let response = self
            .client
            .get(url)
            .header("Authorization", token_header)
            .send()
            .await
            .map_err(|e| AuthError::Network(e.to_string()))?;
        // Distinguish "bad token" (401/404) from real failures so the caller
        // doesn't treat GitHub outages the same as unauthorized requests.
        if !response.status().is_success() {
            return Err(AuthError::InvalidResponse);
        }
        response
            .json::<GithubToken>()
            .await
            .map_err(|e| AuthError::Network(e.to_string()))
    }
}

pub(crate) struct AuthedUser(pub(crate) GithubToken);

pub(crate) struct AuthRejection;

impl IntoResponse for AuthRejection {
    fn into_response(self) -> Response {
        // Return an empty body (no JSON) on purpose. The frontend's login-state
        // fetcher calls `response.json()` unconditionally and relies on it
        // *throwing* to detect a logged-out user (see atcoder-problems-frontend
        // `InternalAPIClient` / `UserState.isLoggedIn`). A parseable JSON error
        // body would instead resolve to a truthy non-`UserResponse` object and
        // crash the UI, so we keep the status code but omit the body.
        StatusCode::UNAUTHORIZED.into_response()
    }
}

impl FromRequestParts<AppState> for AuthedUser {
    type Rejection = AuthRejection;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let token = jar.get("token").map(|c| c.value().to_string());
        let Some(token) = token else {
            return Err(AuthRejection);
        };
        match state.github.verify_user(&token).await {
            Ok(gh) => Ok(AuthedUser(gh)),
            Err(_) => Err(AuthRejection),
        }
    }
}
