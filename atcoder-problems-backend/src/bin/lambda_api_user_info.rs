use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::lambda::user_info;
use atcoder_problems_backend::lambda::{LambdaInput, LambdaOutput};

use diesel::{Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
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

    let user_id = e
        .param("user")
        .ok_or_else(|| HandlerError::from("There is no user."))?;

    info!("UserInfo API");
    let user_info = user_info::get_user_info(&conn, user_id).map_handler_error()?;

    let body = serde_json::to_string(&user_info)?;
    Ok(LambdaOutput::new200(body, None))
}
