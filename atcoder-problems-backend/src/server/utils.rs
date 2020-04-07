use crate::error::Result;
use crate::server::{AppData, Authentication, CommonRequest, CommonResponse, PooledConnection};

use async_trait::async_trait;
use md5::{Digest, Md5};
use serde::de::DeserializeOwned;
use tide::{Request, Response};

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
        let token = request.get_cookie("token")?;
        let conn = request.state().pool.get()?;
        let response = client.get_user_id(&token).await?;
        Ok((conn, response.id.to_string()))
    }
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)> {
        let client = self.state().authentication.clone();
        let mut request = self;
        let body: Body = request.body_json().await?;
        let token = request.get_cookie("token")?;
        let conn = request.state().pool.get()?;
        let response = client.get_user_id(&token).await?;
        Ok((body, conn, response.id.to_string()))
    }
}

pub(crate) trait UnwrapResponse {
    fn unwrap_response(self) -> Response;
}

impl UnwrapResponse for Result<Response> {
    fn unwrap_response(self) -> Response {
        self.unwrap_or_else(|e| {
            log::error!("{:?}", e);
            Response::bad_request()
        })
    }
}
