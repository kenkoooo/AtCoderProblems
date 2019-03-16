use actix_web::http::header::{ETag, EntityTag, IF_NONE_MATCH};
use actix_web::middleware::cors::Cors;
use actix_web::{http, App, HttpMessage, HttpRequest, HttpResponse};
use regex::Regex;
use sha2::{Digest, Sha256};

use crate::sql::ConnectorTrait;

trait UserNameExtractor {
    fn extract_user(&self) -> String;
}

impl<T> UserNameExtractor for HttpRequest<T> {
    fn extract_user(&self) -> String {
        self.query()
            .get("user")
            .filter(|user| Regex::new("[a-zA-Z0-9_]+").unwrap().is_match(user))
            .cloned()
            .unwrap_or_else(|| "".to_owned())
    }
}

fn result_api<C: ConnectorTrait>(request: HttpRequest<C>) -> HttpResponse {
    let old_tag = request
        .headers()
        .get(IF_NONE_MATCH)
        .and_then(|tag| tag.to_str().ok())
        .and_then(|tag_str| tag_str.parse::<EntityTag>().ok());
    let hash = |user: &str, count: usize| {
        let mut hasher = Sha256::new();
        hasher.input(user.as_bytes());
        hasher.input(b" ");
        hasher.input(count.to_be_bytes());
        format!("{:x}", hasher.result())
    };
    let user = request.extract_user();

    request
        .state()
        .get_submissions(&user)
        .map(|submission| {
            let new_tag = EntityTag::new(true, hash(&user, submission.len()));
            match old_tag {
                Some(ref old_tag) if old_tag.weak_eq(&new_tag) => {
                    HttpResponse::NotModified().set(ETag(new_tag)).finish()
                }
                _ => HttpResponse::Ok().set(ETag(new_tag)).json(submission),
            }
        })
        .unwrap_or_else(|_| HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR))
}

fn user_info_api<C: ConnectorTrait>(request: HttpRequest<C>) -> HttpResponse {
    let user_id = request.extract_user();
    request
        .state()
        .get_user_info(&user_id)
        .map(|user_info| HttpResponse::Ok().json(user_info))
        .unwrap_or_else(|_| HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR))
}

pub fn server_config<S: ConnectorTrait + 'static>(app: App<S>) -> App<S> {
    Cors::for_app(app)
        .allowed_origin("*")
        .resource("/results", |r| {
            r.method(http::Method::GET).with(result_api);
        })
        .resource("/v2/user_info", |r| {
            r.method(http::Method::GET).with(user_info_api);
        })
        .register()
}
