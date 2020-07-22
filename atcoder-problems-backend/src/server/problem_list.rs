use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::problem_list_manager::ProblemListManager;

use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_own_lists<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let (conn, user_id) = request.get_unpack().await?;
    let list = conn.get_list(&user_id).await?;
    let response = Response::ok().body_json(&list)?;
    Ok(response)
}

pub(crate) async fn get_single_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let list_id = request.param::<String>("list_id")?;
    let conn = request.state().pool.acquire().await?;
    let list = conn.get_single_list(&list_id).await?;
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
    let internal_list_id = conn
        .create_list(&internal_user_id, &query.list_name)
        .await?;
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
    conn.delete_list(&query.internal_list_id).await?;
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
    conn.update_list(&query.internal_list_id, &query.name)
        .await?;
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
    conn.add_item(&query.internal_list_id, &query.problem_id).await?;
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
    conn.update_item(&query.internal_list_id, &query.problem_id, &query.memo)
        .await?;
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
    conn.delete_item(&query.internal_list_id, &query.problem_id)
        .await?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}
