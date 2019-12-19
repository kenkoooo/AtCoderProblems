use crate::server::utils::{RequestUnpack, UnwrapResponse};
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::virtual_contest_manager::VirtualContestManager;

use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn create_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        title: String,
        memo: String,
        start_epoch_second: i64,
        duration_second: i64,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(q, conn, user_id)| {
            let contest_id = conn.create_contest(
                &q.title,
                &q.memo,
                &user_id,
                q.start_epoch_second,
                q.duration_second,
            )?;
            Ok(contest_id)
        })
        .and_then(|contest_id| {
            let body = serde_json::json!({ "contest_id": format!("{}", contest_id) });
            let response = Response::ok().body_json(&body)?;
            Ok(response)
        })
        .unwrap_response()
}

pub(crate) async fn update_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        id: String,
        title: String,
        memo: String,
        start_epoch_second: i64,
        duration_second: i64,
    }

    request
        .post_unpack::<Q>()
        .await
        .and_then(|(q, conn, _)| {
            conn.update_contest(
                &q.id,
                &q.title,
                &q.memo,
                q.start_epoch_second,
                q.duration_second,
            )
        })
        .map(|_| Response::ok())
        .unwrap_response()
}

pub(crate) async fn update_items<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
        problem_ids: Vec<String>,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(q, conn, user_id)| conn.update_items(&q.contest_id, &q.problem_ids, &user_id))
        .and_then(|_| {
            let response = Response::ok().body_json(&serde_json::json!({}))?;
            Ok(response)
        })
        .unwrap_response()
}

pub(crate) async fn get_my_contests<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    request
        .get_unpack()
        .await
        .and_then(|(conn, user_id)| conn.get_own_contests(&user_id))
        .and_then(|contests| Ok(Response::ok().body_json(&contests)?))
        .unwrap_response()
}

pub(crate) async fn get_participated<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    request
        .get_unpack()
        .await
        .and_then(|(conn, user_id)| conn.get_participated_contests(&user_id))
        .and_then(|contests| Ok(Response::ok().body_json(&contests)?))
        .unwrap_response()
}

pub(crate) async fn get_single_contest<A>(request: Request<AppData<A>>) -> Response {
    match request.param::<String>("contest_id") {
        Ok(contest_id) => request.state().respond(|conn| {
            let contest = conn.get_single_contest(&contest_id)?;
            let response = Response::ok().body_json(&contest)?;
            Ok(response)
        }),
        _ => Response::internal_error(),
    }
}

pub(crate) async fn join_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
    }
    request
        .post_unpack::<Q>()
        .await
        .and_then(|(q, conn, user_id)| conn.join_contest(&q.contest_id, &user_id))
        .and_then(|_| {
            let response = Response::ok().body_json(&serde_json::json!({}))?;
            Ok(response)
        })
        .unwrap_response()
}
