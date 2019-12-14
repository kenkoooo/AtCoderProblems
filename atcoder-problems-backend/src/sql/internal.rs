use crate::error::Result;
use crate::server::{AppData, Authentication, CommonRequest, PooledConnection};

use async_trait::async_trait;
use serde::de::DeserializeOwned;
use tide::Request;

pub(crate) mod problem_list_manager;
pub(crate) mod user_manager;

#[async_trait]
pub(crate) trait RequestUnpack {
    async fn post_unpack<Body: DeserializeOwned + Send + Sync + 'static>(
        self,
    ) -> Result<(Body, PooledConnection, String)>;
}

#[async_trait]
impl<A: Authentication + Clone + Send + Sync + 'static> RequestUnpack for Request<AppData<A>> {
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
