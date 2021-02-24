use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use serde::Deserialize;
use sql_client::internal::user_manager::UserManager;
use tide::{Request, Response, Result};

pub(crate) async fn update<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        atcoder_user_id: String,
    }
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let body = request.parse_body::<Q>().await?;
    conn.update_internal_user_info(&user_id, &body.atcoder_user_id)
        .await?;
    Ok(Response::empty_json())
}

pub(crate) async fn get<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let info = conn.get_internal_user_info(&user_id).await?;
    Ok(Response::json(&info)?)
}
