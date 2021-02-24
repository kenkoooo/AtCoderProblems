use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use serde::Deserialize;
use sql_client::internal::problem_list_manager::ProblemListManager;
use tide::{Request, Response, Result};

pub(crate) async fn get_own_lists<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let list = conn.get_list(&user_id).await?;
    let response = Response::json(&list)?;
    Ok(response)
}

pub(crate) async fn get_single_list<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    let list_id = request.param("list_id")?;
    let conn = request.state().pg_pool.clone();
    let list = conn.get_single_list(&list_id).await?;
    let response = Response::json(&list)?;
    Ok(response)
}

pub(crate) async fn create_list<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Query {
        list_name: String,
    }
    let internal_user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Query>().await?;
    let internal_list_id = conn
        .create_list(&internal_user_id, &query.list_name)
        .await?;
    let body = serde_json::json!({ "internal_list_id": internal_list_id });
    let response = Response::json(&body)?;
    Ok(response)
}

pub(crate) async fn delete_list<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
    }
    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Q>().await?;
    conn.delete_list(&query.internal_list_id).await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn update_list<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        name: String,
    }
    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Q>().await?;
    conn.update_list(&query.internal_list_id, &query.name)
        .await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn add_item<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Q>().await?;
    conn.add_item(&query.internal_list_id, &query.problem_id)
        .await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn update_item<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
        memo: String,
    }
    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Q>().await?;
    conn.update_item(&query.internal_list_id, &query.problem_id, &query.memo)
        .await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn delete_item<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let query = request.parse_body::<Q>().await?;
    conn.delete_item(&query.internal_list_id, &query.problem_id)
        .await?;
    let response = Response::empty_json();
    Ok(response)
}
