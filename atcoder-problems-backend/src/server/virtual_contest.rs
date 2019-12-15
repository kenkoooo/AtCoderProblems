use crate::error::Result;
use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse, PooledConnection};
use crate::sql::internal::virtual_contest_manager::VirtualContestManager;

use serde::Deserialize;
use std::collections::BTreeMap;
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
    fn response(conn: PooledConnection, q: Q, user_id: &str) -> Result<Response> {
        let contest_id = conn.create_contest(
            &q.title,
            &q.memo,
            user_id,
            q.start_epoch_second,
            q.duration_second,
        )?;
        let mut map = BTreeMap::new();
        map.insert("contest_id", contest_id);
        let response = Response::ok().body_json(&map)?;
        Ok(response)
    }

    match request.post_unpack::<Q>().await {
        Ok((q, conn, internal_user_id)) => match response(conn, q, &internal_user_id) {
            Ok(response) => response,
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
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

    match request.post_unpack::<Q>().await {
        Ok((q, conn, _)) => match conn.update_contest(
            &q.id,
            &q.title,
            &q.memo,
            q.start_epoch_second,
            q.duration_second,
        ) {
            Ok(_) => Response::ok(),
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
}

pub(crate) async fn add_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
        problem_id: String,
    }

    match request.post_unpack::<Q>().await {
        Ok((q, conn, user_id)) => match conn.add_item(&q.contest_id, &q.problem_id, &user_id) {
            Ok(_) => Response::ok(),
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
}

pub(crate) async fn delete_item<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
        problem_id: String,
    }

    match request.post_unpack::<Q>().await {
        Ok((q, conn, user_id)) => match conn.remove_item(&q.contest_id, &q.problem_id, &user_id) {
            Ok(_) => Response::ok(),
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
}

pub(crate) async fn get_my_contests<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    match request.get_unpack().await {
        Ok((conn, user_id)) => match conn.get_own_contests(&user_id) {
            Ok(contests) => match Response::ok().body_json(&contests) {
                Ok(response) => response,
                Err(_) => Response::internal_error(),
            },
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
}

pub(crate) async fn get_participated<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Response {
    match request.get_unpack().await {
        Ok((conn, user_id)) => match conn.get_participated_contests(&user_id) {
            Ok(contests) => match Response::ok().body_json(&contests) {
                Ok(response) => response,
                Err(_) => Response::internal_error(),
            },
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
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

    match request.post_unpack::<Q>().await {
        Ok((q, conn, user_id)) => match conn.join_contest(&q.contest_id, &user_id) {
            Ok(_) => Response::ok(),
            _ => Response::internal_error(),
        },
        _ => Response::bad_request(),
    }
}
