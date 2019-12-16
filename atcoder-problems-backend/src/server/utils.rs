use crate::error::Result;
use crate::server::{AppData, Authentication, CommonRequest, CommonResponse, PooledConnection};

use async_trait::async_trait;
use md5::{Digest, Md5};
use serde::de::DeserializeOwned;
use tide::{Request, Response};

pub(crate) fn calc_etag_for_user(user_id: &str, count: usize) -> String {
    let mut hasher = Md5::new();
    hasher.input(user_id.as_bytes());
    hasher.input(b" ");
    hasher.input(count.to_be_bytes());
    hex::encode(hasher.result())
}

pub(crate) fn calc_etag_for_time(from_epoch_second: i64, max_id: i64) -> String {
    let mut hasher = Md5::new();
    hasher.input(from_epoch_second.to_be_bytes());
    hasher.input(b" ");
    hasher.input(max_id.to_be_bytes());
    hex::encode(hasher.result())
}

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
        let user_id = client.get_user_id(&token).await?;
        Ok((conn, user_id))
    }
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)> {
        let client = self.state().authentication.clone();
        let mut request = self;
        let body: Body = request.body_json().await?;
        let token = request.get_cookie("token")?;
        let conn = request.state().pool.get()?;
        let user_id = client.get_user_id(&token).await?;
        Ok((body, conn, user_id))
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
