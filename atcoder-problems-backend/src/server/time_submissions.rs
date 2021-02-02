use crate::server::{AppData, CommonResponse};
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use tide::{Request, Response, Result};

pub(crate) async fn get_time_submissions<A>(request: Request<AppData<A>>) -> Result<Response> {
    let from = request.param("from")?;
    let from_epoch_second = from.parse::<i64>()?;
    let conn = request.state().pg_pool.clone();
    let submissions: Vec<_> = conn
        .get_submissions(SubmissionRequest::FromTime {
            from_second: from_epoch_second,
            count: 1000,
        })
        .await?;
    let response = Response::json(&submissions)?.make_cors();
    Ok(response)
}
