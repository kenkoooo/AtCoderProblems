#[macro_use]
extern crate lambda_runtime as lambda;
#[macro_use]
extern crate log;
extern crate openssl;

use atcoder_problems_sql_common::models::Submission;
use atcoder_problems_sql_common::schema::*;
use diesel::dsl::*;
use diesel::prelude::*;
use diesel::{Connection, PgConnection};
use hex;
use lambda::error::HandlerError;
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
    lambda!(my_handler);
    Ok(())
}

fn map_params<'a>(params: &'a LambdaInputQueryParameters) -> Option<SubmissionAPIParam<'a>> {
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

fn my_handler(e: LambdaInput, c: lambda::Context) -> Result<CustomOutput, HandlerError> {
    info!("header: {:?}", e.headers);
    let url = env::var("SQL_URL").map_err(|_| c.new_error("SQL_URL must be set"))?;
    let conn =
        PgConnection::establish(&url).map_err(|_| c.new_error("Failed to connect to SQL"))?;

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let path = e.path_parameters.path;
    let params = e.query_string_parameters;

    match path.as_str() {
        "results" => {
            info!("Submission API");
            let params = map_params(&params).ok_or_else(|| c.new_error("Failed to load params"))?;
            let (body, etag) = get_results(params, &conn, &c)?;

            match get_header(&e.headers, "If-None-Match") {
                Some(tag) if tag == &etag => Ok(CustomOutput {
                    is_base64_encoded: false,
                    status_code: 304,
                    body: String::new(),
                    headers,
                }),
                _ => {
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
                .ok_or_else(|| c.new_error("user_id is required"))?;
            let accepted_count = accepted_count::table
                .filter(accepted_count::user_id.eq(&user_id))
                .select(accepted_count::problem_count)
                .first::<i32>(&conn)
                .map_err(|_| c.new_error("Failed to load accepted_count"))?;
            let accepted_count_rank = accepted_count::table
                .filter(accepted_count::problem_count.gt(accepted_count))
                .select(count_star())
                .first::<i64>(&conn)
                .map_err(|_| c.new_error("Failed to load accepted_count_rank"))?;
            let rated_point_sum = rated_point_sum::table
                .filter(rated_point_sum::user_id.eq(&user_id))
                .select(rated_point_sum::point_sum)
                .first::<f64>(&conn)
                .map_err(|_| c.new_error("Failed to load rated_point_sum"))?;
            let rated_point_sum_rank = rated_point_sum::table
                .filter(rated_point_sum::point_sum.gt(rated_point_sum))
                .select(count_star())
                .first::<i64>(&conn)
                .map_err(|_| c.new_error("Failed to load rated_point_sum_rank"))?;

            serde_json::to_string(&UserInfo {
                user_id,
                accepted_count,
                accepted_count_rank,
                rated_point_sum,
                rated_point_sum_rank,
            })
            .map_err(|_| c.new_error("Failed to convert user_info to JSON"))
            .map(|body| CustomOutput {
                is_base64_encoded: false,
                status_code: 200,
                body,
                headers,
            })
        }
        _ => Err(c.new_error("invalid path")),
    }
}

fn get_header<'a>(headers: &'a HashMap<String, String>, field: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(key, _)| key.to_ascii_lowercase() == field.to_ascii_lowercase())
        .map(|(_, value)| value.as_str())
}

fn get_results<'a>(
    params: SubmissionAPIParam<'a>,
    conn: &PgConnection,
    c: &lambda::Context,
) -> Result<(String, String), HandlerError> {
    match params {
        SubmissionAPIParam::UserSubmission { user_id } => {
            let submissions = submissions::table
                .filter(submissions::user_id.eq(user_id))
                .load::<Submission>(conn)
                .map_err(|_| c.new_error("Failed to load submissions"))?;

            let mut hasher = Md5::new();
            hasher.input(user_id.as_bytes());
            hasher.input(b" ");
            hasher.input(submissions.len().to_be_bytes());
            let etag = hex::encode(hasher.result());

            serde_json::to_string(&submissions)
                .map_err(|_| c.new_error("Failed to convert submissions to JSON"))
                .map(|body| (body, etag))
        }
        SubmissionAPIParam::TimeSubmission { from_epoch_second } => {
            let submissions = submissions::table
                .filter(submissions::epoch_second.ge(from_epoch_second))
                .order_by(submissions::epoch_second.asc())
                .limit(1000)
                .load::<Submission>(conn)
                .map_err(|_| c.new_error("Failed to load submissions"))?;

            let max_id = submissions.iter().map(|s| s.id).max().unwrap_or(0);

            let mut hasher = Md5::new();
            hasher.input(from_epoch_second.to_be_bytes());
            hasher.input(b" ");
            hasher.input(submissions.len().to_be_bytes());
            hasher.input(b" ");
            hasher.input(max_id.to_be_bytes());
            let etag = hex::encode(hasher.result());

            serde_json::to_string(&submissions)
                .map_err(|_| c.new_error("Failed to convert submissions to JSON"))
                .map(|body| (body, etag))
        }
    }
}
