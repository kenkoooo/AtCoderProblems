use crate::error::Result;
use crate::server::{request_with_connection, AppData};
use crate::server::{utils, EtagExtractor};
use crate::sql::models::Submission;
use crate::sql::{SubmissionClient, SubmissionRequest};
use actix_web::http::header::ETAG;
use actix_web::{web, HttpRequest, HttpResponse};

pub async fn get_time_submissions(
    request: HttpRequest,
    path: web::Path<(i64,)>,
    data: web::Data<AppData>,
) -> HttpResponse {
    let from_epoch_second = path.0;
    request_with_connection(&data.pool, |conn| {
        let etag = request.extract_etag();
        match inner(conn, from_epoch_second, etag) {
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
    from_epoch_second: i64,
    etag: &str,
) -> Result<Option<(Vec<Submission>, String)>> {
    let submissions: Vec<_> = c.get_submissions(SubmissionRequest::FromTime {
        from_second: from_epoch_second,
        count: 1000,
    })?;
    let max_id = submissions.iter().map(|s| s.id).max().unwrap_or(0);
    let new_etag = utils::calc_etag_for_time(from_epoch_second, max_id);
    if new_etag.as_str() == etag {
        Ok(None)
    } else {
        Ok(Some((submissions, new_etag)))
    }
}
