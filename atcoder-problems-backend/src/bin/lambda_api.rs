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

#[derive(Serialize, Clone)]
struct CustomOutput {
    #[serde(rename = "isBase64Encoded")]
    is_base64_encoded: bool,
    #[serde(rename = "statusCode")]
    status_code: u32,
    body: String,
    headers: HashMap<String, String>,
}

#[derive(Serialize)]
struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}

#[derive(Deserialize)]
struct LambdaInput {
    #[serde(rename = "pathParameters")]
    path_parameters: LambdaInputPathParameters,

    #[serde(rename = "queryStringParameters")]
    query_string_parameters: LambdaInputQueryParameters,

    headers: HashMap<String, String>,
}

#[derive(Deserialize)]
struct LambdaInputPathParameters {
    #[serde(rename = "proxy")]
    path: String,
}

#[derive(Deserialize)]
struct LambdaInputQueryParameters {
    user: Option<String>,
    from: Option<String>,
}

enum SubmissionAPIParam<'a> {
    UserSubmission { user_id: &'a str },
    TimeSubmission { from_epoch_second: i64 },
}

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(handler);
    Ok(())
}

fn map_params(params: &LambdaInputQueryParameters) -> Option<SubmissionAPIParam> {
    params
        .user
        .as_ref()
        .map(|user_id| SubmissionAPIParam::UserSubmission { user_id })
        .or_else(|| {
            params
                .from
                .as_ref()
                .and_then(|from| from.parse::<i64>().ok())
                .map(|from_epoch_second| SubmissionAPIParam::TimeSubmission { from_epoch_second })
        })
}

fn handler(e: LambdaInput, _: Context) -> Result<CustomOutput, HandlerError> {
    info!("header: {:?}", e.headers);
    let url = env::var("SQL_URL")?;
    let conn = PgConnection::establish(&url).map_handler_error()?;

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let path = e.path_parameters.path;
    let params = e.query_string_parameters;

    match path.as_str() {
        "results" => {
            info!("Submission API");
            let params =
                map_params(&params).ok_or_else(|| HandlerError::from("Failed to load params"))?;
            let etag = get_etag(&params, &conn)?;

            match get_header(&e.headers, "If-None-Match") {
                Some(tag) if tag == etag => Ok(CustomOutput {
                    is_base64_encoded: false,
                    status_code: 304,
                    body: String::new(),
                    headers,
                }),
                _ => {
                    let body = get_body(&params, &conn)?;
                    headers.insert("etag".to_owned(), etag);
                    Ok(CustomOutput {
                        is_base64_encoded: false,
                        status_code: 200,
                        body,
                        headers,
                    })
                }
            }
        }
        "v2/user_info" => {
            info!("UserInfo API");
            let user_id = params
                .user
                .ok_or_else(|| HandlerError::from("user_id is required"))?;
            let accepted_count = accepted_count::table
                .filter(accepted_count::user_id.eq(&user_id))
                .select(accepted_count::problem_count)
                .first::<i32>(&conn)
                .map_handler_error()?;
            let accepted_count_rank = accepted_count::table
                .filter(accepted_count::problem_count.gt(accepted_count))
                .select(count_star())
                .first::<i64>(&conn)
                .map_handler_error()?;
            let rated_point_sum = rated_point_sum::table
                .filter(rated_point_sum::user_id.eq(&user_id))
                .select(rated_point_sum::point_sum)
                .first::<f64>(&conn)
                .map_handler_error()?;
            let rated_point_sum_rank = rated_point_sum::table
                .filter(rated_point_sum::point_sum.gt(rated_point_sum))
                .select(count_star())
                .first::<i64>(&conn)
                .map_handler_error()?;

            let body = serde_json::to_string(&UserInfo {
                user_id,
                accepted_count,
                accepted_count_rank,
                rated_point_sum,
                rated_point_sum_rank,
            })?;
            Ok(CustomOutput {
                is_base64_encoded: false,
                status_code: 200,
                body,
                headers,
            })
        }
        x => Err(HandlerError::from(format!("Unknown path: {}", x).as_str())),
    }
}

fn get_header<'a>(headers: &'a HashMap<String, String>, field: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(key, _)| key.to_ascii_lowercase() == field.to_ascii_lowercase())
        .map(|(_, value)| value.as_str())
}

fn get_etag<'a>(
    params: &SubmissionAPIParam<'a>,
    conn: &PgConnection,
) -> Result<String, HandlerError> {
    match params {
        SubmissionAPIParam::UserSubmission { user_id } => {
            let count: i64 = submissions::table
                .filter(submissions::user_id.eq(user_id))
                .select(count_star())
                .first(conn)
                .map_handler_error()?;

            let mut hasher = Md5::new();
            hasher.input(user_id.as_bytes());
            hasher.input(b" ");
            hasher.input(count.to_be_bytes());
            let etag = hex::encode(hasher.result());
            Ok(etag)
        }
        SubmissionAPIParam::TimeSubmission { from_epoch_second } => {
            let count: i64 = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .select(count_star())
                .first(conn)
                .map_handler_error()?;

            let max_id: Option<i64> = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .select(max(submissions::id))
                .first(conn)
                .map_handler_error()?;

            let mut hasher = Md5::new();
            hasher.input(from_epoch_second.to_be_bytes());
            hasher.input(b" ");
            hasher.input(count.to_be_bytes());
            hasher.input(b" ");
            hasher.input(std::cmp::min(1000, max_id.unwrap_or(0)).to_be_bytes());
            let etag = hex::encode(hasher.result());
            Ok(etag)
        }
    }
}

fn get_body<'a>(
    params: &SubmissionAPIParam<'a>,
    conn: &PgConnection,
) -> Result<String, HandlerError> {
    match params {
        SubmissionAPIParam::UserSubmission { user_id } => {
            let submissions = submissions::table
                .filter(submissions::user_id.eq(user_id))
                .load::<Submission>(conn)
                .map_handler_error()?;

            let result = serde_json::to_string(&submissions)?;
            Ok(result)
        }
        SubmissionAPIParam::TimeSubmission { from_epoch_second } => {
            let submissions = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .order_by(submissions::epoch_second.asc())
                .limit(1000)
                .load::<Submission>(conn)
                .map_handler_error()?;

            let result = serde_json::to_string(&submissions)?;
            Ok(result)
        }
    }
}
