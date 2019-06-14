use atcoder_problems_backend::api::lambda::{LambdaInput, LambdaOutput};
use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::sql::AcceptedCountClient;

use diesel::dsl::*;
use diesel::prelude::*;
use diesel::{Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use serde::Serialize;
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

    let mut headers = HashMap::new();
    headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());

    let user_id = e
        .param("user")
        .ok_or_else(|| HandlerError::from("There is no user."))?;

    use atcoder_problems_backend::sql::schema::*;
    info!("UserInfo API");
    let accepted_count = conn.get_users_accepted_count(user_id).map_handler_error()?;
    let accepted_count_rank = conn
        .get_accepted_count_rank(accepted_count)
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
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    })?;
    Ok(LambdaOutput::new200(body, headers))
}

#[derive(Serialize)]
struct UserInfo<'a> {
    user_id: &'a str,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}
