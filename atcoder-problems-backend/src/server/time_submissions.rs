use crate::server::{AppData, CommonResponse};
use crate::sql::{SubmissionClient, SubmissionRequest};
use tide::{Request, Response};

pub(crate) async fn get_time_submissions<A>(request: Request<AppData<A>>) -> Response {
    if let Some(from_epoch_second) = request
        .param::<String>("from")
        .ok()
        .and_then(|s| s.parse::<i64>().ok())
    {
        request.state().respond(|conn| {
            let submissions: Vec<_> = conn.get_submissions(SubmissionRequest::FromTime {
                from_second: from_epoch_second,
                count: 1000,
            })?;
            Ok(Response::new_cors().body_json(&submissions)?)
        })
    } else {
        Response::internal_error()
    }
}
