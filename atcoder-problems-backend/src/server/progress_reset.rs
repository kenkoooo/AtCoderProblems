use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use serde::Deserialize;
use sql_client::internal::progress_reset_manager::ProgressResetManager;
use tide::{Request, Response, Result};

pub(crate) async fn get_progress_reset_list<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    let user_id = request.get_authorized_id().await?;
    let pool = request.state().pg_pool.clone();
    let list = pool.get_progress_reset_list(&user_id).await?;
    let response = Response::json(&list)?;
    Ok(response)
}

pub(crate) async fn add_progress_reset_item<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
        reset_epoch_second: i64,
    }
    let internal_user_id = request.get_authorized_id().await?;
    let pool = request.state().pg_pool.clone();
    let query = request.parse_body::<Query>().await?;
    pool.add_item(
        &internal_user_id,
        &query.problem_id,
        query.reset_epoch_second,
    )
    .await?;
    Ok(Response::ok())
}

pub(crate) async fn delete_progress_reset_item<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        problem_id: String,
    }
    let internal_user_id = request.get_authorized_id().await?;
    let pool = request.state().pg_pool.clone();
    let query = request.parse_body::<Query>().await?;
    pool.remove_item(&internal_user_id, &query.problem_id)
        .await?;
    Ok(Response::ok())
}
