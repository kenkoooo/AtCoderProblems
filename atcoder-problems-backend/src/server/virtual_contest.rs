use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};

use serde::{Deserialize, Serialize};
use sql_client::internal::virtual_contest_manager::{
    VirtualContestInfo, VirtualContestItem, VirtualContestManager,
};
use tide::{Request, Response, Result};

pub(crate) async fn create_contest<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        title: String,
        memo: String,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<String>,
        is_public: Option<bool>,
        penalty_second: i64,
    }

    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let q: Q = request.parse_body().await?;
    let contest_id = conn
        .create_contest(
            &q.title,
            &q.memo,
            &user_id,
            q.start_epoch_second,
            q.duration_second,
            q.mode.as_deref(),
            q.is_public.unwrap_or(true),
            q.penalty_second,
        )
        .await?;
    let body = serde_json::json!({ "contest_id": contest_id });
    let response = Response::json(&body)?;
    Ok(response)
}

pub(crate) async fn update_contest<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Deserialize)]
    struct Q {
        id: String,
        title: String,
        memo: String,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<String>,
        is_public: Option<bool>,
        penalty_second: i64,
    }

    request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let q: Q = request.parse_body().await?;
    conn.update_contest(
        &q.id,
        &q.title,
        &q.memo,
        q.start_epoch_second,
        q.duration_second,
        q.mode.as_deref(),
        q.is_public.unwrap_or(true),
        q.penalty_second,
    )
    .await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn update_items<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
        problems: Vec<VirtualContestItem>,
    }

    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let q: Q = request.parse_body().await?;
    conn.update_items(&q.contest_id, &q.problems, &user_id)
        .await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn get_my_contests<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let contests = conn.get_own_contests(&user_id).await?;
    let response = Response::json(&contests)?;
    Ok(response)
}

pub(crate) async fn get_participated<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let contests = conn.get_participated_contests(&user_id).await?;
    let response = Response::json(&contests)?;
    Ok(response)
}

pub(crate) async fn get_single_contest<A>(request: Request<AppData<A>>) -> Result<Response>
where
    A: Authentication + Clone + Send + Sync + 'static,
{
    #[derive(Serialize)]
    struct VirtualContestDetails {
        info: VirtualContestInfo,
        problems: Vec<VirtualContestItem>,
        participants: Vec<String>,
    }

    let conn = request.state().pg_pool.clone();
    let contest_id = request.param("contest_id")?;

    let info = conn.get_single_contest_info(&contest_id).await?;
    let participants = conn.get_single_contest_participants(&contest_id).await?;
    let problems = conn.get_single_contest_problems(&contest_id).await?;
    let contest = VirtualContestDetails {
        info,
        participants,
        problems,
    };
    let response = Response::json(&contest)?;
    Ok(response)
}

pub(crate) async fn get_recent_contests<A>(request: Request<AppData<A>>) -> Result<Response> {
    let conn = request.state().pg_pool.clone();
    let contest = conn.get_recent_contest_info().await?;
    let response = Response::json(&contest)?;
    Ok(response)
}

pub(crate) async fn join_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
    }
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let q: Q = request.parse_body().await?;
    conn.join_contest(&q.contest_id, &user_id).await?;
    let response = Response::empty_json();
    Ok(response)
}

pub(crate) async fn leave_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
    }
    let user_id = request.get_authorized_id().await?;
    let conn = request.state().pg_pool.clone();
    let q: Q = request.parse_body().await?;
    conn.leave_contest(&q.contest_id, &user_id).await?;
    let response = Response::empty_json();
    Ok(response)
}
