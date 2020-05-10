use crate::server::utils::{RequestUnpack, UnwrapResponse};
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::progress_reset_manager::ProgressResetManager;
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_progress_reset_list<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    request
        .get_unpack()
        .await
        .and_then(|(conn, user_id)| conn.get_progress_reset_list(&user_id))
        .and_then(|list| {
            let response = Response::ok().body_json(&list)?;
            Ok(response)
        })
        .unwrap_response()
}

pub(crate) async fn add_progress_reset_item<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
        reset_epoch_second: i64,
    }
    request
        .post_unpack::<Query>()
        .await
        .and_then(|(query, conn, internal_user_id)| {
            conn.add_item(
                &internal_user_id,
                &query.problem_id,
                query.reset_epoch_second,
            )?;
            Ok(Response::ok())
        })
        .unwrap_response()
}

pub(crate) async fn delete_progress_reset_item<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
    }
    request
        .post_unpack::<Query>()
        .await
        .and_then(|(query, conn, internal_user_id)| {
            conn.remove_item(&internal_user_id, &query.problem_id)?;
            Ok(Response::ok())
        })
        .unwrap_response()
}
