use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::progress_reset_manager::ProgressResetManager;
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_progress_reset_list<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    let (conn, user_id) = request.get_unpack().await?;
    let list = conn.get_progress_reset_list(&user_id)?;
    let response = Response::ok().body_json(&list)?;
    Ok(response)
}

pub(crate) async fn add_progress_reset_item<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
        reset_epoch_second: i64,
    }
    let (query, conn, internal_user_id) = request.post_unpack::<Query>().await?;
    conn.add_item(
        &internal_user_id,
        &query.problem_id,
        query.reset_epoch_second,
    )?;
    Ok(Response::ok())
}

pub(crate) async fn delete_progress_reset_item<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
    }
    let (query, conn, internal_user_id) = request.post_unpack::<Query>().await?;
    conn.remove_item(&internal_user_id, &query.problem_id)?;
    Ok(Response::ok())
}
