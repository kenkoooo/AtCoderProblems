#[macro_use]
extern crate lambda_runtime as lambda;
#[macro_use]
extern crate log;
extern crate openssl;

use atcoder_problems_sql_common::models::Submission;
use atcoder_problems_sql_common::schema::*;
use diesel::prelude::*;
use diesel::{Connection, PgConnection};
use lambda::error::HandlerError;
use openssl_probe;
use serde::Serialize;
use serde_json;
use serde_json::Value;
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

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(my_handler);
    Ok(())
}

fn my_handler(e: Value, c: lambda::Context) -> Result<CustomOutput, HandlerError> {
    let url = env::var("SQL_URL").map_err(|_| c.new_error("SQL_URL must be set"))?;
    let conn =
        PgConnection::establish(&url).map_err(|_| c.new_error("Failed to connect to SQL"))?;

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let path = e
        .get("pathParameters")
        .ok_or_else(|| c.new_error("Input doesn't have pathParameters"))?
        .get("proxy")
        .ok_or_else(|| c.new_error("Input doesn't have pathParameters.proxy"))?
        .as_str()
        .ok_or_else(|| c.new_error("pathParameters.proxy is not a string"))?;
    let user_id = e
        .get("queryStringParameters")
        .ok_or_else(|| c.new_error("Input doesn't have queryStringParameters"))?
        .get("user")
        .ok_or_else(|| c.new_error("Input doesn't have queryStringParameters.user"))?
        .as_str()
        .ok_or_else(|| c.new_error("queryStringParameters.user is not a string"))?;

    info!("Loading {}:{}", path, user_id);
    match path {
        "results" => submissions::table
            .filter(submissions::user_id.eq(user_id))
            .load::<Submission>(&conn)
            .map_err(|_| c.new_error("Failed to load submissions"))
            .and_then(|submissions| {
                serde_json::to_string(&submissions)
                    .map_err(|_| c.new_error("Failed to convert submissions to JSON"))
            }),
        "v2/user_info" => submissions::table
            .filter(submissions::user_id.eq(user_id))
            .load::<Submission>(&conn)
            .map_err(|_| c.new_error("Failed to load user_info"))
            .and_then(|submissions| {
                serde_json::to_string(&submissions)
                    .map_err(|_| c.new_error("Failed to convert user_info to JSON"))
            }),
        _ => Err(c.new_error("invalid path")),
    }
    .map(|body| CustomOutput {
        is_base64_encoded: false,
        status_code: 200,
        body,
        headers,
    })
}
