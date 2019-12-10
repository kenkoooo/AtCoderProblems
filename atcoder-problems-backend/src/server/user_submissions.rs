use crate::error::Result;
use crate::server::{create_cors_response, request_with_connection, utils, AppData, EtagExtractor};
use crate::sql::models::Submission;

use crate::sql::{SubmissionClient, SubmissionRequest};
use http::header::ETAG;
use serde::Deserialize;
use tide::{Request, Response};

#[derive(Deserialize, Debug)]
struct Query {
    user: String,
}

pub(crate) async fn get_user_submissions(request: Request<AppData>) -> Response {
    request_with_connection(&request.state().pool, |conn| {
        let etag = request.extract_etag();
        match inner(conn, &request, etag) {
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
}

fn inner<C: SubmissionClient>(
    c: &C,
    request: &Request<AppData>,
    etag: &str,
) -> Result<Option<(Vec<Submission>, String)>> {
    let query = request.query::<Query>()?;
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
        Ok(None)
    } else {
        Ok(Some((submissions, heavy_etag)))
    }
}
