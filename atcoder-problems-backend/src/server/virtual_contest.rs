use crate::server::utils::RequestUnpack;
use crate::server::{AppData, Authentication, CommonResponse};
use crate::sql::internal::virtual_contest_manager::{
    VirtualContestInfo, VirtualContestItem, VirtualContestManager,
};

use serde::{Deserialize, Serialize};
use tide::{Request, Response};

pub(crate) async fn create_contest<A>(request: Request<AppData<A>>) -> tide::Result<Response>
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
    let (q, conn, user_id) = request.post_unpack::<Q>().await?;
    let contest_id = conn.create_contest(
        &q.title,
        &q.memo,
        &user_id,
        q.start_epoch_second,
        q.duration_second,
        q.mode.as_deref(),
        q.is_public.unwrap_or(true),
        q.penalty_second,
    )?;
    let body = serde_json::json!({ "contest_id": contest_id });
    let response = Response::ok().body_json(&body)?;
    Ok(response)
}

pub(crate) async fn update_contest<A>(request: Request<AppData<A>>) -> tide::Result<Response>
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

    let (q, conn, _) = request.post_unpack::<Q>().await?;
    conn.update_contest(
        &q.id,
        &q.title,
        &q.memo,
        q.start_epoch_second,
        q.duration_second,
        q.mode.as_deref(),
        q.is_public.unwrap_or(true),
        q.penalty_second,
    )?;
    Ok(Response::ok().body_json(&serde_json::json!({}))?)
}

pub(crate) async fn update_items<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
        problems: Vec<VirtualContestItem>,
    }

    let (q, conn, user_id) = request.post_unpack::<Q>().await?;
    conn.update_items(&q.contest_id, &q.problems, &user_id)?;
    Ok(Response::ok().body_json(&serde_json::json!({}))?)
}

pub(crate) async fn get_my_contests<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let (conn, user_id) = request.get_unpack().await?;
    let contests = conn.get_own_contests(&user_id)?;
    Ok(Response::ok().body_json(&contests)?)
}

pub(crate) async fn get_participated<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let (conn, user_id) = request.get_unpack().await?;
    let contests = conn.get_participated_contests(&user_id)?;
    Ok(Response::ok().body_json(&contests)?)
}

pub(crate) async fn get_single_contest<A>(request: Request<AppData<A>>) -> tide::Result<Response> {
    #[derive(Serialize)]
    struct VirtualContestDetails {
        info: VirtualContestInfo,
        problems: Vec<VirtualContestItem>,
        participants: Vec<String>,
    }

    let conn = request.state().pool.get()?;
    let contest_id = request.param::<String>("contest_id")?;
    let contest = VirtualContestDetails {
        info: conn.get_single_contest_info(&contest_id)?,
        participants: conn.get_single_contest_participants(&contest_id)?,
        problems: conn.get_single_contest_problems(&contest_id)?,
    };
    let response = Response::ok().body_json(&contest)?;
    Ok(response)
}

pub(crate) async fn get_recent_contests<A>(request: Request<AppData<A>>) -> tide::Result<Response> {
    let conn = request.state().pool.get()?;
    let contest = conn.get_recent_contest_info()?;
    let response = Response::ok().body_json(&contest)?;
    Ok(response)
}

pub(crate) async fn join_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
    }
    let (q, conn, user_id) = request.post_unpack::<Q>().await?;
    conn.join_contest(&q.contest_id, &user_id)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}

pub(crate) async fn leave_contest<A: Authentication + Clone + Send + Sync + 'static>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize)]
    struct Q {
        contest_id: String,
    }
    let (q, conn, user_id) = request.post_unpack::<Q>().await?;
    conn.leave_contest(&q.contest_id, &user_id)?;
    let response = Response::ok().body_json(&serde_json::json!({}))?;
    Ok(response)
}
