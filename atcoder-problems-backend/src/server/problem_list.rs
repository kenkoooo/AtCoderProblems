use crate::server::utils::{RequestUnpack, UnwrapResponse};
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::problem_list_manager::ProblemListManager;

use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    request
        .get_unpack()
        .await
        .and_then(|(conn, user_id)| conn.get_list(&user_id))
        .and_then(|list| {
            let response = Response::ok().body_json(&list)?;
            Ok(response)
        })
        .unwrap_response()
}

pub(crate) async fn create_list<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Query {
        list_name: String,
    }

    request
        .post_unpack::<Query>()
        .await
        .and_then(|(query, conn, internal_user_id)| {
            let list_id = conn.create_list(&internal_user_id, &query.list_name)?;
            Ok(list_id)
        })
        .and_then(|internal_list_id| {
            let body = serde_json::json!({ "internal_list_id": format!("{}", internal_list_id) });
            let response = Response::ok().body_json(&body)?;
            Ok(response)
        })
        .unwrap_response()
}

pub(crate) async fn delete_list<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(query, conn, _)| conn.delete_list(&query.internal_list_id))
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}

pub(crate) async fn update_list<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        name: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(query, conn, _)| conn.update_list(&query.internal_list_id, &query.name))
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}

pub(crate) async fn add_item<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(query, conn, _)| conn.add_item(&query.internal_list_id, &query.problem_id))
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}

pub(crate) async fn update_item<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
        memo: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(query, conn, _)| {
            conn.update_item(&query.internal_list_id, &query.problem_id, &query.memo)
        })
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}

pub(crate) async fn delete_item<A>(request: Request<AppData<A>>) -> Response
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        internal_list_id: String,
        problem_id: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(query, conn, _)| conn.delete_item(&query.internal_list_id, &query.problem_id))
        .and_then(|_| Ok(Response::ok().body_json(&serde_json::json!({}))?))
        .unwrap_response()
}
