use crate::server::MakeCors;
use actix_web::{error, web, HttpResponse, Result};
use sql_client::{
    submission_client::{SubmissionClient, SubmissionRequest},
    PgPool,
};

pub(crate) async fn get_time_submissions(
    pool: web::Data<PgPool>,
    from: web::Path<i64>,
) -> Result<HttpResponse> {
    let from_epoch_second = from.into_inner();
    let submissions: Vec<_> = pool
        .get_submissions(SubmissionRequest::FromTime {
            from_second: from_epoch_second,
            count: 1000,
        })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::Ok().make_cors().json(&submissions);
    Ok(response)
}
