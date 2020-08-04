use crate::error::Result;
use crate::server::{AppData, Authentication, PooledConnection};

use crate::error::ErrorTypes::CookieNotFound;
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
        let mut request = self;
        let body: Body = request.body_json().await?;
        let conn = request.state().pool.get()?;
        Ok((body, conn, authorized_id))
    }

    async fn get_authorized_id(&self) -> Result<String> {
        let client = self.state().authentication.clone();
        let token = self.cookie("token").ok_or_else(|| CookieNotFound)?;
        let response = client.get_user_id(&token.value()).await?;
        Ok(response.id.to_string())
    }
}
