use crate::server::{AppData, MakeCors};
use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};

pub(crate) async fn get_time_submissions<A>(
    _request: HttpRequest,
    data: web::Data<AppData<A>>,
    from: web::Path<i64>,
) -> Result<HttpResponse> {
    let from_epoch_second = from.into_inner();
    let conn = data.pg_pool.clone();
    let submissions: Vec<_> = conn
        .get_submissions(SubmissionRequest::FromTime {
            from_second: from_epoch_second,
            count: 1000,
        })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::Ok().make_cors().json(&submissions);
    Ok(response)
}
