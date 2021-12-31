use crate::server::{AppData, CommonResponse};
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use actix_web::{error, web, HttpRequest, HttpResponse, Result};

struct Query {
    from: i64
}

pub(crate) async fn get_time_submissions<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<Query>
) -> Result<HttpResponse> {
    let from_epoch_second = query.from;
    let conn = data.pg_pool.clone();
    let submissions: Vec<_> = conn
        .get_submissions(SubmissionRequest::FromTime {
            from_second: from_epoch_second,
            count: 1000,
        })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&submissions)?.make_cors();
    Ok(response)
}
