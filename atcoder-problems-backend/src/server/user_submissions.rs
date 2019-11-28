use crate::error::Result;
use crate::server::{request_with_connection, Pool};
use crate::sql::models::Submission;

use crate::sql::{SubmissionClient, SubmissionRequest};
use actix_web::http::header::{ETAG, IF_NONE_MATCH};
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use md5::{Digest, Md5};
use serde::Deserialize;

#[derive(Deserialize)]
struct Query {
    user: String,
}

fn calc_etag(user_id: &str, count: usize) -> String {
    let mut hasher = Md5::new();
    hasher.input(user_id.as_bytes());
    hasher.input(b" ");
    hasher.input(count.to_be_bytes());
    hex::encode(hasher.result())
}

pub async fn get_user_submissions(request: HttpRequest, pool: web::Data<Pool>) -> HttpResponse {
    request_with_connection(request, pool, |request, conn| {
        let etag = request
            .headers()
            .get(IF_NONE_MATCH)
            .and_then(|value| value.to_str().ok())
            .unwrap_or_else(|| "no etag");
        match inner(conn, &request, etag) {
            Ok(r) => match r {
                Some((submissions, etag)) => HttpResponse::build(StatusCode::OK)
                    .header(ETAG, etag)
                    .json(submissions),
                None => HttpResponse::NotModified().finish(),
            },
            _ => HttpResponse::BadRequest().finish(),
        }
    })
}

fn inner<C: SubmissionClient>(
    c: &C,
    request: &HttpRequest,
    etag: &str,
) -> Result<Option<(Vec<Submission>, String)>> {
    let web::Query(query) = web::Query::<Query>::from_query(request.query_string())?;
    let user_id = &query.user;
    let lite_count: i64 = c.get_user_submission_count(user_id)?;
    let lite_etag = calc_etag(user_id, lite_count as usize);
    if lite_etag.as_str() == etag {
        return Ok(None);
    }

    let submissions = c.get_submissions(SubmissionRequest::UserAll { user_id })?;
    let heavy_count = submissions.len();
    let heavy_etag = calc_etag(user_id, heavy_count);
    if heavy_etag.as_str() == etag {
        return Ok(None);
    } else {
        return Ok(Some((submissions, heavy_etag)));
    }
}
