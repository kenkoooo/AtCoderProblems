use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::lambda::{LambdaInput, LambdaOutput};
use atcoder_problems_backend::sql::{SubmissionClient, SubmissionRequest};

use diesel::{Connection, PgConnection};
use hex;
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use md5::{Digest, Md5};
use openssl_probe;
use serde_json;
use simple_logger;
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

    info!("User Submission API: {:?}", e);

    let user_id = e
        .param("user")
        .ok_or_else(|| HandlerError::from("There is no user."))?;
    let count: i64 = conn
        .get_user_submission_count(user_id)
        .map_handler_error()?;

    let mut hasher = Md5::new();
    hasher.input(user_id.as_bytes());
    hasher.input(b" ");
    hasher.input(count.to_be_bytes());
    let etag = hex::encode(hasher.result());

    match e.header("If-None-Match") {
        Some(tag) if tag == etag => Ok(LambdaOutput::new304()),
        _ => {
            let submissions = conn
                .get_submissions(SubmissionRequest::UserAll { user_id })
                .map_handler_error()?;
            let body = serde_json::to_string(&submissions)?;
            Ok(LambdaOutput::new200(body, Some(etag)))
        }
    }
}
