use crate::server::{utils, AppData, CommonRequest, CommonResponse};
use crate::sql::{SubmissionClient, SubmissionRequest};
use serde::Deserialize;
use tide::{Request, Response};

pub(crate) async fn get_user_submissions<A>(request: Request<AppData<A>>) -> Response {
    #[derive(Deserialize, Debug)]
    struct Query {
        user: String,
    }
    request.state().respond(|conn| {
        let etag = request.extract_etag();
        let query = request.query::<Query>()?;
        let user_id = &query.user;
        let lite_count: i64 = conn.get_user_submission_count(user_id)?;
        let lite_etag = utils::calc_etag_for_user(user_id, lite_count as usize);
        if lite_etag.as_str() == etag {
            return Ok(Response::not_modified());
        }

        let submissions = conn.get_submissions(SubmissionRequest::UserAll { user_id })?;
        let heavy_count = submissions.len();
        let heavy_etag = utils::calc_etag_for_user(user_id, heavy_count);
        if heavy_etag.as_str() != lite_etag.as_str() {
            conn.update_user_submission_count(user_id)?;
        }
        if heavy_etag.as_str() == etag {
            Ok(Response::not_modified())
        } else {
            let response = Response::etagged(&heavy_etag).body_json(&submissions)?;
            Ok(response)
        }
    })
}

pub(crate) async fn get_recent_submissions<A>(request: Request<AppData<A>>) -> Response {
    request.state().respond(|conn| {
        let submissions = conn.get_submissions(SubmissionRequest::RecentAll { count: 1000 })?;
        let response = Response::ok().body_json(&submissions)?;
        Ok(response)
    })
}

pub(crate) async fn get_users_time_submissions<A>(request: Request<AppData<A>>) -> Response {
    #[derive(Deserialize, Debug)]
    struct Query {
        users: String,
        problems: String,
        from: i64,
        to: i64,
    }
    request.state().respond(|conn| {
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
    })
}
