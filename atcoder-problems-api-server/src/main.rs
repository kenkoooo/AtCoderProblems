use std::env;

use actix_web::{server, App};

use atcoder_problems_api_server::api;
use atcoder_problems_api_server::config::Config;
use atcoder_problems_api_server::sql::SqlConnector;

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::create_from_file(&args[1]).unwrap();
    let connector = SqlConnector::new(
        &config.postgresql_user,
        &config.postgresql_pass,
        &config.postgresql_host,
    );

    server::new(move || App::with_state(connector.clone()).configure(api::server_config))
        .bind("0.0.0.0:8080")
        .unwrap()
        .run();
}
