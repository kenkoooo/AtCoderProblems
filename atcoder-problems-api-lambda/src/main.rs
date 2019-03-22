#[macro_use]
extern crate lambda_runtime as lambda;

use lambda::error::HandlerError;
use serde::Serialize;
use serde_json;
use serde_json::Value;

use std::collections::HashMap;
use std::env;
use std::error::Error;

use atcoder_problems_api_lambda::sql::{ConnectorTrait, SqlConnector};

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
    lambda!(my_handler);

    Ok(())
}

fn my_handler(e: Value, c: lambda::Context) -> Result<CustomOutput, HandlerError> {
    let host = env::var("SQL_HOST").unwrap();
    let user = env::var("SQL_USER").unwrap();
    let pass = env::var("SQL_PASS").unwrap();

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let conn = SqlConnector::new(&user, &pass, &host);

    let path = e
        .get("pathParameters")
        .unwrap()
        .get("proxy")
        .unwrap()
        .as_str()
        .unwrap();
    let user_id = e
        .get("queryStringParameters")
        .unwrap()
        .get("user")
        .unwrap()
        .as_str()
        .unwrap();

    match path {
        "results" => conn
            .get_submissions(user_id)
            .map_err(|e| c.new_error(&format!("{:?}", e)))
            .and_then(|s| serde_json::to_string(&s).map_err(|e| c.new_error(&format!("{:?}", e)))),
        "v2/user_info" => conn
            .get_user_info(user_id)
            .map_err(|e| c.new_error(&format!("{:?}", e)))
            .and_then(|s| serde_json::to_string(&s).map_err(|e| c.new_error(&format!("{:?}", e)))),
        _ => Err(c.new_error("invalid path")),
    }
    .map(|body| CustomOutput {
        is_base64_encoded: false,
        status_code: 200,
        body,
        headers,
    })
}
