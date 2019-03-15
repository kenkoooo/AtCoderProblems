use std::env;

use actix_web::http::header::{ETag, EntityTag, IF_NONE_MATCH};
use actix_web::middleware::cors::Cors;
use actix_web::{http, server, App, HttpMessage, HttpRequest, HttpResponse};
use regex::Regex;
use sha2::{Digest, Sha256};

use atcoder_problems_api_server::config::Config;
use atcoder_problems_api_server::sql::*;
use atcoder_problems_api_server::UserInfo;

trait UserNameExtractor {
    fn extract_user(&self) -> String;
}

impl<T> UserNameExtractor for HttpRequest<T> {
    fn extract_user(&self) -> String {
        self.query()
            .get("user")
            .filter(|user| Regex::new("[a-zA-Z0-9_]+").unwrap().is_match(user))
            .map(|user| user.clone())
            .unwrap_or("".to_owned())
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::create_from_file(&args[1]).unwrap();

    server::new(move || {
        App::with_state(config.clone()).configure(|app| {
            Cors::for_app(app)
                .allowed_origin("*")
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

fn result_api(request: HttpRequest<Config>) -> HttpResponse {
    let old_tag = request.headers().get(IF_NONE_MATCH);
    println!("{:?}", old_tag);
    let hash = |user: &str, count: usize| {
        let mut hasher = Sha256::new();
        hasher.input(user.as_bytes());
        hasher.input(" ".as_bytes());
        hasher.input(count.to_be_bytes());
        format!("{:x}", hasher.result())
    };
    let user = request.extract_user();
    match get_connection(
        &request.state().postgresql_user,
        &request.state().postgresql_pass,
        &request.state().postgresql_host,
    )
    .and_then(|conn| get_submissions(&user, &conn))
    {
        Ok(submission) => {
            let new_tag = hash(&user, submission.len());
            match old_tag {
                Some(old_tag) if old_tag == &new_tag => {
                    let mut builder = HttpResponse::NotModified();
                    builder.set(ETag(EntityTag::new(true, new_tag)));
                    builder.finish()
                }
                _ => {
                    let mut builder = HttpResponse::Ok();
                    builder.set(ETag(EntityTag::new(true, new_tag)));
                    builder.json(submission)
                }
            }
        }
        _ => HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

fn user_info_api(request: HttpRequest<Config>) -> HttpResponse {
    let user_id = request.extract_user();
    match get_user_info(request.state(), user_id) {
        Ok(user_info) => HttpResponse::Ok().json(user_info),
        _ => HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

fn get_user_info(config: &Config, user_id: String) -> Result<UserInfo, String> {
    let conn = get_connection(
        &config.postgresql_user,
        &config.postgresql_pass,
        &config.postgresql_host,
    )?;
    let (accepted_count, accepted_count_rank) =
        get_count_rank::<i32>(&user_id, &conn, "accepted_count", "problem_count", 0)?;
    let (rated_point_sum, rated_point_sum_rank) =
        get_count_rank::<f64>(&user_id, &conn, "rated_point_sum", "point_sum", 0.0)?;
    Ok(UserInfo {
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    })
}
