use crate::error::Result;
use crate::server::{request_with_connection, utils, AppData, EtagExtractor};
use crate::sql::models::Submission;

use crate::sql::{SubmissionClient, SubmissionRequest};
use actix_web::http::header::ETAG;
use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;

#[derive(Deserialize)]
struct Query {
    user: String,
}

pub async fn get_user_submissions(request: HttpRequest, data: web::Data<AppData>) -> HttpResponse {
    request_with_connection(&data.pool, move |conn| {
        let etag = request.extract_etag();
        match inner(conn, &request, etag) {
            Ok(r) => match r {
                Some((s, e)) => HttpResponse::Ok().header(ETAG, e).json(s),
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
    let lite_etag = utils::calc_etag_for_user(user_id, lite_count as usize);
    if lite_etag.as_str() == etag {
        return Ok(None);
    }

    let submissions = c.get_submissions(SubmissionRequest::UserAll { user_id })?;
    let heavy_count = submissions.len();
    let heavy_etag = utils::calc_etag_for_user(user_id, heavy_count);
    if heavy_etag.as_str() == etag {
        return Ok(None);
    } else {
        return Ok(Some((submissions, heavy_etag)));
    }
}
