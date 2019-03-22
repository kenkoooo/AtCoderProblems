#[macro_use]
extern crate log;
extern crate simple_logger;

#[macro_use]
extern crate lambda_runtime as lambda;
extern crate openssl;

use atcoder_problems_sql_common::schema::*;
use diesel::prelude::*;
use diesel::Queryable;
use diesel::{Connection, PgConnection};
use lambda::error::HandlerError;
use openssl_probe;
use rusoto_core::{ByteStream, Region};
use rusoto_s3::{GetObjectRequest, PutObjectRequest, S3Client, S3};
use serde::Serialize;
use serde_json;
use std::env;
use std::error::Error;

#[derive(Debug, Eq, PartialEq, Queryable, Serialize)]
struct UserProblemCount {
    user_id: String,
    problem_count: i32,
}

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    info!("Started!");
    lambda!(my_handler);

    Ok(())
}

fn my_handler(_: String, c: lambda::Context) -> Result<String, HandlerError> {
    let url = env::var("SQL_URL").map_err(|_| c.new_error("SQL_URL must be set."))?;
    let conn =
        PgConnection::establish(&url).map_err(|_| c.new_error("Failed to connect to SQL."))?;
    let client = S3Client::new(Region::ApNortheast1);

    let data = vec![
        (
            "resources/short.json",
            shortest_submission_count::table.load::<UserProblemCount>(&conn),
        ),
        (
            "resources/fast.json",
            fastest_submission_count::table.load::<UserProblemCount>(&conn),
        ),
        (
            "resources/first.json",
            first_submission_count::table.load::<UserProblemCount>(&conn),
        ),
    ];

    for (path, body) in data.into_iter() {
        let body = body.map_err(|_| c.new_error("Failed to load"))?;
        let request =
            create_request(body, path).map_err(|_| c.new_error("Failed to serialize."))?;
        info!("Sending to {} ...", path);
        client
            .put_object(request)
            .sync()
            .map_err(|_| c.new_error("Failed to put object"))?;
    }

    Ok(String::new())
}

fn create_request<T: Serialize>(obj: T, path: &str) -> serde_json::Result<PutObjectRequest> {
    let mut request = PutObjectRequest::default();
    request.bucket = String::from("kenkoooo.com");
    request.key = String::from(path);
    request.body = Some(ByteStream::from(
        serde_json::to_string(&obj)?.as_bytes().to_vec(),
    ));
    Ok(request)
}
