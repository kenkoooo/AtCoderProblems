use crate::server::{AppData, Authentication};
use async_trait::async_trait;
use actix_web::{Result, cookie::Cookie, error};

#[async_trait(?Send)]
pub(crate) trait GetAuthId {
    async fn get_authorized_id(&self, token: Option<Cookie<'static>>) -> Result<String>;
}

#[async_trait(?Send)]
impl<A: Authentication + Clone + Send + Sync + 'static> GetAuthId for AppData<A> {
    async fn get_authorized_id(&self, token: Option<Cookie<'static>>) -> Result<String> {
        let client = self.authentication.clone();
        let token = token.ok_or_else(|| error::ErrorUnauthorized("Cookie not found"))?;
        let response = client
            .get_user_id(token.value())
            .await
            .map_err(|_| error::ErrorInternalServerError("GitHub connection error"))?;
        Ok(response.id.to_string())
    }
}