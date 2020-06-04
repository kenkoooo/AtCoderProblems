use crate::server::{utils, AppData, CommonResponse};
use crate::sql::{SubmissionClient, SubmissionRequest};
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_user_submissions<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize, Debug)]
    struct Query {
        user: String,
    }
    let conn = request.state().pool.get()?;
    let query = request.query::<Query>()?;
    let user_id = &query.user;
    let submissions = conn.get_submissions(SubmissionRequest::UserAll { user_id })?;
    let response = Response::new_cors()
        .set_header("Cache-Control", "max-age=300")
        .body_json(&submissions)?;
    Ok(response)
}

pub(crate) async fn get_recent_submissions<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    let conn = request.state().pool.get()?;
    let submissions = conn.get_submissions(SubmissionRequest::RecentAll { count: 1000 })?;
    let response = Response::ok().body_json(&submissions)?;
    Ok(response)
}

pub(crate) async fn get_users_time_submissions<A>(
    request: Request<AppData<A>>,
) -> tide::Result<Response> {
    #[derive(Deserialize, Debug)]
    struct Query {
        users: String,
        problems: String,
        from: i64,
        to: i64,
    }

    let conn = request.state().pool.get()?;
    let query = request.query::<Query>()?;
    let user_ids = query.users.split(",").map(|s| s.trim()).collect::<Vec<_>>();
    let problem_ids = query
        .problems
        .split(",")
        .map(|s| s.trim())
        .collect::<Vec<_>>();
    let submissions = conn.get_submissions(SubmissionRequest::UsersProblemsTime {
        user_ids: &user_ids,
        problem_ids: &problem_ids,
        from_second: query.from,
        to_second: query.to,
    })?;
    let response = Response::ok().body_json(&submissions)?;
    Ok(response)
}
