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

#[cfg(test)]
mod test {
    use super::*;
    use crate::{Submission, UserInfo};
    use actix_web::test::TestServer;
    use serde_json;
    use serde_json::Value;

    struct TestConnector {}
    impl ConnectorTrait for TestConnector {
        fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String> {
            let submission = Submission {
                id: 0,
                epoch_second: 0,
                problem_id: "".to_owned(),
                contest_id: "".to_owned(),
                user_id: user_id.to_owned(),
                language: "".to_owned(),
                point: 0.0,
                length: 0,
                result: "".to_owned(),
                execution_time: Some(1),
            };
            Ok(vec![submission])
        }
        fn get_user_info(&self, user_id: &str) -> Result<UserInfo, String> {
            Ok(UserInfo {
                user_id: user_id.to_owned(),
                accepted_count: 0,
                accepted_count_rank: 0,
                rated_point_sum: 0.0,
                rated_point_sum_rank: 0,
            })
        }
    }

    #[derive(Clone)]
    struct TestConfig {}
    impl ConfigTrait<TestConnector> for TestConfig {
        fn get_conn(&self) -> Result<TestConnector, String> {
            Ok(TestConnector {})
        }
    }

    #[test]
    fn test_api_response() {
        let config = TestConfig {};
        let mut srv = TestServer::build_with_state(move || config.clone()).start(|app| {
            app.resource("/results", |r| {
                r.method(http::Method::GET).with(result_api);
            })
            .resource("/v2/user_info", |r| {
                r.method(http::Method::GET).with(user_info_api);
            });
        });

        let query_submission = |srv: &mut TestServer, url: &str| {
            let request = srv.client(http::Method::GET, url).finish().unwrap();
            let response = srv.execute(request.send()).unwrap();
            let bytes = srv.execute(response.body()).unwrap();
            let v: Value = serde_json::from_slice(&bytes).unwrap();
            let user_id = v.get(0).unwrap().get("user_id").unwrap();
            match user_id {
                Value::String(s) => s.to_owned(),
                _ => unreachable!(),
            }
        };

        let user_id = query_submission(&mut srv, "/results");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_submission(&mut srv, "/results?u");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_submission(&mut srv, "/results?user=");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_submission(&mut srv, "/results?user=kenkoooo");
        assert_eq!(user_id, "kenkoooo".to_owned());

        let query_user_info = |srv: &mut TestServer, url: &str| {
            let request = srv.client(http::Method::GET, url).finish().unwrap();
            let response = srv.execute(request.send()).unwrap();
            let bytes = srv.execute(response.body()).unwrap();
            let v: Value = serde_json::from_slice(&bytes).unwrap();
            let user_id = v.get("user_id").unwrap();
            match user_id {
                Value::String(s) => s.to_owned(),
                _ => unreachable!(),
            }
        };

        let user_id = query_user_info(&mut srv, "/v2/user_info");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_user_info(&mut srv, "/v2/user_info?u");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_user_info(&mut srv, "/v2/user_info?user=");
        assert_eq!(user_id, "".to_owned());

        let user_id = query_user_info(&mut srv, "/v2/user_info?user=kenkoooo");
        assert_eq!(user_id, "kenkoooo".to_owned());
    }
}
