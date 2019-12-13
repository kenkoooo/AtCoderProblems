use crate::server::{utils, EtagExtractor};
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
            let etag = request.extract_etag();
            let max_id = submissions.iter().map(|s| s.id).max().unwrap_or(0);
            let new_etag = utils::calc_etag_for_time(from_epoch_second, max_id);
            if new_etag.as_str() == etag {
                Ok(Response::not_modified())
            } else {
                Ok(Response::etagged(&new_etag).body_json(&submissions)?)
            }
        })
    } else {
        Response::internal_error()
    }
}
