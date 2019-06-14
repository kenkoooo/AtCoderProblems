use atcoder_problems_backend::api::lambda::{LambdaInput, LambdaOutput};
use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::{SubmissionClient, SubmissionRequest};

use diesel::{Connection, PgConnection};
use hex;
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use md5::{Digest, Md5};
use openssl_probe;
use serde_json;
use simple_logger;
use std::collections::HashMap;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(handler);
    Ok(())
}

fn handler(e: LambdaInput, _: Context) -> Result<LambdaOutput, HandlerError> {
    let url = env::var("SQL_URL")?;
    let conn: PgConnection = PgConnection::establish(&url).map_handler_error()?;

    info!("Time Submission API: {:?}", e);
    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let from_epoch_second = e
        .path("time")
        .ok_or_else(|| HandlerError::from("There is no time."))?
        .parse::<i64>()?;
    let submissions: Vec<Submission> = conn
        .get_submissions(SubmissionRequest::FromTime {
            from_second: from_epoch_second,
            count: 1000,
        })
        .map_handler_error()?;
    let max_id = submissions.iter().map(|s| s.id).max().unwrap_or(0);

    let mut hasher = Md5::new();
    hasher.input(from_epoch_second.to_be_bytes());
    hasher.input(b" ");
    hasher.input(max_id.to_be_bytes());
    let etag = hex::encode(hasher.result());

    match e.header("If-None-Match") {
        Some(tag) if tag == etag => Ok(LambdaOutput::new304(headers)),
        _ => {
            let body = serde_json::to_string(&submissions)?;
            headers.insert("etag".to_owned(), etag);
            Ok(LambdaOutput::new200(body, headers))
        }
    }
}
