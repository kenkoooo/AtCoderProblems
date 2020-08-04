use crate::error::ToAnyhowError;
use crate::server::{AppData, Authentication, PooledConnection};
use anyhow::Context;
use anyhow::Result;
use async_trait::async_trait;
use serde::de::DeserializeOwned;
use tide::Request;

#[async_trait]
pub(crate) trait RequestUnpack {
    async fn get_unpack(&self) -> Result<(PooledConnection, String)>;
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)>;

    async fn get_authorized_id(&self) -> Result<String>;
    async fn parse_body<Body>(self) -> Result<Body>
    where
        Body: DeserializeOwned + Send + Sync + 'static;
}

#[async_trait]
impl<A: Authentication + Clone + Send + Sync + 'static> RequestUnpack for Request<AppData<A>> {
    async fn get_unpack(&self) -> Result<(PooledConnection, String)> {
        let authorized_id = self.get_authorized_id().await?;
        let conn = self.state().pool.get()?;
        Ok((conn, authorized_id))
    }

    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)> {
        let authorized_id = self.get_authorized_id().await?;
        let conn = self.state().pool.get()?;
        let body: Body = self.parse_body().await?;
        Ok((body, conn, authorized_id))
    }

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
        let body: Body = request.body_json().await.map_anyhow()?;
        Ok(body)
    }
}
