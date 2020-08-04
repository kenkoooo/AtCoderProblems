use crate::server::{AppData, CommonResponse};
use crate::sql::{SubmissionClient, SubmissionRequest};
use anyhow::Result;
use tide::{Request, Response};

pub(crate) async fn get_time_submissions<A>(request: Request<AppData<A>>) -> Result<Response> {
    let from = request.param::<String>("from")?;
    let from_epoch_second = from.parse::<i64>()?;
    let conn = request.state().pool.get()?;
    let submissions: Vec<_> = conn.get_submissions(SubmissionRequest::FromTime {
        from_second: from_epoch_second,
        count: 1000,
    })?;
    let response = Response::json(&submissions)?.make_cors();
    Ok(response)
}
