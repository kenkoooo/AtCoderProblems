use crate::server::utils::{RequestUnpack, UnwrapResponse};
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::problem_list_manager::ProblemListManager;

use crate::error::Error;
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_own_lists<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let (conn, user_id) = request.get_unpack().await?;
    let list = conn.get_list(&user_id)?;
    let response = Response::ok().body_json(&list)?;
    Ok(response)
}

pub(crate) async fn get_single_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let list_id = request.param::<String>("list_id")?;
    let conn = request.state().pool.get()?;
    let list = conn.get_single_list(&list_id)?;
    let response = Response::ok().body_json(&list)?;
    Ok(response)
}

pub(crate) async fn create_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize)]
    struct Query {
        list_name: String,
    }
    let (query, conn, internal_user_id) = request.post_unpack::<Query>().await?;
    let internal_list_id = conn.create_list(&internal_user_id, &query.list_name)?;
    let body = serde_json::json!({ "internal_list_id": internal_list_id });
    let response = Response::ok().body_json(&body)?;
    Ok(response)
}

pub(crate) async fn delete_list<A>(request: Request<AppData<A>>) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
    }
    let (query, conn, _) = request.post_unpack::<Q>().await?;
    conn.delete_list(&query.internal_list_id)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}

pub(crate) async fn update_list<A>(request: Request<AppData<A>>) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        name: String,
    }
    let (query, conn, _) = request.post_unpack::<Q>().await?;
    conn.update_list(&query.internal_list_id, &query.name)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}

pub(crate) async fn add_item<A>(request: Request<AppData<A>>) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    let (query, conn, _) = request.post_unpack::<Q>().await?;
    conn.add_item(&query.internal_list_id, &query.problem_id)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}

pub(crate) async fn update_item<A>(request: Request<AppData<A>>) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
        memo: String,
    }

    let (query, conn, _) = request.post_unpack::<Q>().await?;
    conn.update_item(&query.internal_list_id, &query.problem_id, &query.memo)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}

pub(crate) async fn delete_item<A>(request: Request<AppData<A>>) -> tide::Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    let (query, conn, _) = request.post_unpack::<Q>().await?;
    conn.delete_item(&query.internal_list_id, &query.problem_id)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}
