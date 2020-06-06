use crate::error::Result;
use crate::server::{AppData, Authentication, PooledConnection};

use crate::error::ErrorTypes::CookieNotFound;
use async_trait::async_trait;
use serde::de::DeserializeOwned;
use tide::Request;

#[async_trait]
pub(crate) trait RequestUnpack {
    async fn get_unpack(self) -> Result<(PooledConnection, String)>;
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)>;
}

#[async_trait]
impl<A: Authentication + Clone + Send + Sync + 'static> RequestUnpack for Request<AppData<A>> {
    async fn get_unpack(self) -> Result<(PooledConnection, String)> {
        let client = self.state().authentication.clone();
        let request = self;
        let token = request.cookie("token").ok_or_else(|| CookieNotFound)?;
        let conn = request.state().pool.get()?;
        let response = client.get_user_id(&token.value()).await?;
        Ok((conn, response.id.to_string()))
    }
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)> {
        let client = self.state().authentication.clone();
        let mut request = self;
        let body: Body = request.body_json().await?;
        let token = request.cookie("token").ok_or_else(|| CookieNotFound)?;
        let conn = request.state().pool.get()?;
        let response = client.get_user_id(&token.value()).await?;
        Ok((body, conn, response.id.to_string()))
    }
}
