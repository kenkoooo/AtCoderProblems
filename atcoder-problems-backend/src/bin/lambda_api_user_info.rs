use atcoder_problems_backend::lambda::UserInfoHandler;

use lambda_runtime;
use log;
use openssl_probe;
use simple_logger;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    let url = env::var("SQL_URL")?;
    lambda_runtime::start(UserInfoHandler::new(&url)?, None);
    Ok(())
}
