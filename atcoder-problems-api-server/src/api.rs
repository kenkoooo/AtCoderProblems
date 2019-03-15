use actix_web::http::header::{ETag, EntityTag, IF_NONE_MATCH};
use actix_web::{http, HttpMessage, HttpRequest, HttpResponse};
use regex::Regex;
use sha2::{Digest, Sha256};

use crate::config::ConfigTrait;
use crate::sql::ConnectorTrait;

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

pub fn result_api<C: ConnectorTrait, T: ConfigTrait<C>>(request: HttpRequest<T>) -> HttpResponse {
    let old_tag = request
        .headers()
        .get(IF_NONE_MATCH)
        .and_then(|tag| tag.to_str().ok())
        .and_then(|tag_str| tag_str.parse::<EntityTag>().ok());
    let hash = |user: &str, count: usize| {
        let mut hasher = Sha256::new();
        hasher.input(user.as_bytes());
        hasher.input(" ".as_bytes());
        hasher.input(count.to_be_bytes());
        format!("{:x}", hasher.result())
    };
    let user = request.extract_user();

    request
        .state()
        .get_conn()
        .and_then(|conn| conn.get_submissions(&user))
        .map(|submission| {
            let new_tag = EntityTag::new(true, hash(&user, submission.len()));
            match old_tag {
                Some(ref old_tag) if old_tag.weak_eq(&new_tag) => {
                    HttpResponse::NotModified().set(ETag(new_tag)).finish()
                }
                _ => HttpResponse::Ok().set(ETag(new_tag)).json(submission),
            }
        })
        .unwrap_or(HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR))
}

pub fn user_info_api<C: ConnectorTrait, T: ConfigTrait<C>>(
    request: HttpRequest<T>,
) -> HttpResponse {
    let user_id = request.extract_user();
    request
        .state()
        .get_conn()
        .and_then(|conn| conn.get_user_info(&user_id))
        .map(|user_info| HttpResponse::Ok().json(user_info))
        .unwrap_or(HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR))
}
