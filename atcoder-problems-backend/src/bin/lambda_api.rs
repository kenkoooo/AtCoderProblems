use atcoder_problems_backend::api::lambda::{LambdaInput, LambdaOutput, LambdaRequest};
use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::*;

use diesel::dsl::*;
use diesel::prelude::*;
use diesel::{Connection, PgConnection};
use hex;
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use md5::{Digest, Md5};
use openssl_probe;
use serde::{Deserialize, Serialize};
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
    let conn = PgConnection::establish(&url).map_handler_error()?;

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let request = e
        .request()
        .ok_or_else(|| HandlerError::from("invalid input"))?;

    match request {
        LambdaRequest::UserSubmission { user_id } => {
            info!("Submission API");

            let count: i64 = submissions::table
                .filter(submissions::user_id.eq(user_id))
                .select(count_star())
                .first(&conn)
                .map_handler_error()?;

            let mut hasher = Md5::new();
            hasher.input(user_id.as_bytes());
            hasher.input(b" ");
            hasher.input(count.to_be_bytes());
            let etag = hex::encode(hasher.result());

            match e.header("If-None-Match") {
                Some(tag) if tag == etag => Ok(LambdaOutput::new304(headers)),
                _ => {
                    let submissions = submissions::table
                        .filter(submissions::user_id.eq(user_id))
                        .load::<Submission>(&conn)
                        .map_handler_error()?;
                    let body = serde_json::to_string(&submissions)?;
                    headers.insert("etag".to_owned(), etag);
                    Ok(LambdaOutput::new200(body, headers))
                }
            }
        }
        LambdaRequest::TimeSubmission { from_epoch_second } => {
            let count: i64 = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .select(count_star())
                .first(&conn)
                .map_handler_error()?;

            let max_id: Option<i64> = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .select(max(submissions::id))
                .first(&conn)
                .map_handler_error()?;

            let mut hasher = Md5::new();
            hasher.input(from_epoch_second.to_be_bytes());
            hasher.input(b" ");
            hasher.input(count.to_be_bytes());
            hasher.input(b" ");
            hasher.input(std::cmp::min(1000, max_id.unwrap_or(0)).to_be_bytes());
            let etag = hex::encode(hasher.result());
            match e.header("If-None-Match") {
                Some(tag) if tag == etag => Ok(LambdaOutput::new304(headers)),
                _ => {
                    let submissions = submissions::table
                        .filter(submissions::epoch_second.ge(from_epoch_second))
                        .order_by(submissions::epoch_second.asc())
                        .limit(1000)
                        .load::<Submission>(&conn)
                        .map_handler_error()?;
                    let body = serde_json::to_string(&submissions)?;
                    headers.insert("etag".to_owned(), etag);
                    Ok(LambdaOutput::new200(body, headers))
                }
            }
        }
        LambdaRequest::UserInfo { user_id } => {
            info!("UserInfo API");
            let accepted_count = accepted_count::table
                .filter(accepted_count::user_id.eq(user_id))
                .select(accepted_count::problem_count)
                .first::<i32>(&conn)
                .map_handler_error()?;
            let accepted_count_rank = accepted_count::table
                .filter(accepted_count::problem_count.gt(accepted_count))
                .select(count_star())
                .first::<i64>(&conn)
                .map_handler_error()?;
            let rated_point_sum = rated_point_sum::table
                .filter(rated_point_sum::user_id.eq(user_id))
                .select(rated_point_sum::point_sum)
                .first::<f64>(&conn)
                .map_handler_error()?;
            let rated_point_sum_rank = rated_point_sum::table
                .filter(rated_point_sum::point_sum.gt(rated_point_sum))
                .select(count_star())
                .first::<i64>(&conn)
                .map_handler_error()?;

            let body = serde_json::to_string(&UserInfo {
                user_id: user_id.to_string(),
                accepted_count,
                accepted_count_rank,
                rated_point_sum,
                rated_point_sum_rank,
            })?;
            Ok(LambdaOutput::new200(body, headers))
        }
    }
}

#[derive(Serialize)]
struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}
