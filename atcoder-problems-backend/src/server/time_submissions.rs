use crate::error::Result;
use crate::server::{create_cors_response, request_with_connection, AppData};
use crate::server::{utils, EtagExtractor};
use crate::sql::models::Submission;
use crate::sql::{SubmissionClient, SubmissionRequest};
use http::header::ETAG;
use tide::{Request, Response};

pub(crate) async fn get_time_submissions(request: Request<AppData>) -> Response {
    request
        .param::<String>("from")
        .ok()
        .and_then(|s| s.parse::<i64>().ok())
        .map(|from_epoch_second| {
            request_with_connection(&request.state().pool, |conn| {
                let etag = request.extract_etag();
                match inner(conn, from_epoch_second, etag) {
                    Ok(r) => match r {
                        Some((s, e)) => create_cors_response()
                            .set_header(ETAG.as_str(), e)
                            .body_json(&s)
                            .unwrap_or_else(|_| Response::new(503)),
                        None => Response::new(304),
                    },
                    _ => Response::new(400),
                }
            })
        })
        .unwrap_or_else(|| Response::new(503))
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
