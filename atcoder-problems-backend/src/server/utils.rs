use crate::server::{AppData, Authentication};
use anyhow::Context;
use async_trait::async_trait;
use serde::de::DeserializeOwned;
use tide::{Request, Result};

#[async_trait]
pub(crate) trait RequestUnpack {
    async fn get_authorized_id(&self) -> Result<String>;
    async fn parse_body<Body>(self) -> Result<Body>
    where
        Body: DeserializeOwned + Send + Sync + 'static;
}

#[async_trait]
impl<A: Authentication + Clone + Send + Sync + 'static> RequestUnpack for Request<AppData<A>> {
    async fn get_authorized_id(&self) -> Result<String> {
        let client = self.state().authentication.clone();
        let token = self.cookie("token").with_context(|| "Cookie not found")?;
        let response = client
            .get_user_id(&token.value())
            .await
            .map_err(|_| anyhow::Error::msg("GitHub connection error"))?;
        Ok(response.id.to_string())
    }

    async fn parse_body<Body>(self) -> Result<Body>
    where
        Body: DeserializeOwned + Send + Sync + 'static,
    {
        let mut request = self;
        let body: Body = request.body_json().await?;
        Ok(body)
    }
}
