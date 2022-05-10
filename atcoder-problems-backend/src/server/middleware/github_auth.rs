use std::rc::Rc;

use actix_service::{Service, Transform};
use actix_web::{
    body::{EitherBody, MessageBody},
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage,
};
use anyhow::{Context, Result};
use futures_util::{
    future::{self, LocalBoxFuture},
    FutureExt,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Deserialize, Serialize, Clone)]
pub struct GithubToken {
    pub id: i64,
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
    ) -> Result<Self> {
        Ok(Self {
            client: Client::builder().user_agent("AtCoder Problems").build()?,
            base_url: base_url.to_string(),
            api_base_url: api_base_url.to_string(),
            client_id: client_id.to_string(),
            client_secret: client_secret.to_string(),
        })
    }
    pub async fn authorize(&self, code: &str) -> Result<String> {
        let url = format!("{}/login/oauth/access_token", self.base_url);
        let request = json!({
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code
        });
        let response: Value = self
            .client
            .post(url)
            .header("Accept", "application/json")
            .json(&request)
            .send()
            .await?
            .json()
            .await?;
        let access_token = response["access_token"]
            .as_str()
            .context("Invalid Github response")?;
        Ok(access_token.to_string())
    }

    pub async fn verify_user(&self, access_token: &str) -> Result<GithubToken> {
        let token_header = format!("token {}", access_token);
        let url = format!("{}/user", self.api_base_url);
        let response: GithubToken = self
            .client
            .get(url)
            .header("Authorization", token_header)
            .send()
            .await?
            .json()
            .await?;
        Ok(response)
    }
}

#[derive(Clone)]
pub struct GithubAuthentication {
    client: Rc<GithubClient>,
}

impl GithubAuthentication {
    pub fn new(client: GithubClient) -> Self {
        Self {
            client: Rc::new(client),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for GithubAuthentication
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
    B::Error: Into<Error>,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = GithubMiddleware<S>;
    type InitError = ();
    type Future = future::Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        future::ok(GithubMiddleware {
            service: Rc::new(service),
            client: Rc::clone(&self.client),
        })
    }
}

pub struct GithubMiddleware<S> {
    service: Rc<S>,
    client: Rc<GithubClient>,
}

impl<S, B> Service<ServiceRequest> for GithubMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    S::Error: 'static,
    B: MessageBody + 'static,
    B::Error: Into<Error>,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = S::Error;
    type Future = LocalBoxFuture<'static, std::result::Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);
        let client = Rc::clone(&self.client);
        async move {
            if let Some(cookie) = req.cookie("token") {
                let token = cookie.value();
                if let Ok(token) = client.verify_user(token).await {
                    req.extensions_mut().insert(token);
                }
            }
            service.call(req).await.map(|res| res.map_into_left_body())
        }
        .boxed_local()
    }
}
