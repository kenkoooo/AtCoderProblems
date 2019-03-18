use std::env;

use actix_web::{http, server, App, HttpResponse};

use actix_web::middleware::cors::Cors;
use atcoder_problems_api_server::api::*;
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

    server::new(move || {
        App::with_state(connector.clone()).configure(|app| {
            Cors::for_app(app)
                .allowed_origin("*")
                .resource("/", |r| r.f(|_| HttpResponse::Ok()))
                .resource("/results", |r| {
                    r.method(http::Method::GET).with(result_api);
                })
                .resource("/v2/user_info", |r| {
                    r.method(http::Method::GET).with(user_info_api);
                })
                .register()
        })
    })
    .bind("0.0.0.0:8080")
    .unwrap()
    .run();
}
