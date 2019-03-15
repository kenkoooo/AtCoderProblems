use std::env;

use actix_web::middleware::cors::Cors;
use actix_web::{http, server, App};

use atcoder_problems_api_server::api;
use atcoder_problems_api_server::config::Config;

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::create_from_file(&args[1]).unwrap();

    server::new(move || {
        App::with_state(config.clone()).configure(|app| {
            Cors::for_app(app)
                .allowed_origin("*")
                .resource("/results", |r| {
                    r.method(http::Method::GET).with(api::result_api);
                })
                .resource("/v2/user_info", |r| {
                    r.method(http::Method::GET).with(api::user_info_api);
                })
                .register()
        })
    })
    .bind("0.0.0.0:8080")
    .unwrap()
    .run();
}
