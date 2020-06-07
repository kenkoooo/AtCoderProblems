use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};

use crate::sql::internal::user_manager::UserManager;
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn update<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        atcoder_user_id: String,
    }
    let (body, conn, user_id) = request.post_unpack::<Q>().await?;
    conn.update_internal_user_info(&user_id, &body.atcoder_user_id)?;
    Ok(Response::ok().body_json(&serde_json::json!({}))?)
}

pub(crate) async fn get<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let (conn, user_id) = request.get_unpack().await?;
    let info = conn.get_internal_user_info(&user_id)?;
    Ok(Response::ok().body_json(&info)?)
}
