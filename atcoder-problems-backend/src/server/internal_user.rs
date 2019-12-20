use crate::server::utils::{RequestUnpack, UnwrapResponse};
use crate::server::{AppData, Authentication, CommonResponse};

use crate::sql::internal::user_manager::UserManager;
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn update<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        atcoder_user_id: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(body, conn, user_id)| {
            conn.update_internal_user_info(&user_id, &body.atcoder_user_id)
        })
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}

pub(crate) async fn get<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    request
        .get_unpack()
        .await
        .and_then(|(conn, user_id)| conn.get_internal_user_info(&user_id))
        .and_then(|info| Ok(Response::ok().body_json(&info)?))
        .unwrap_response()
}
