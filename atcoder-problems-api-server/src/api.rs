use actix_web::http::header::{ETag, EntityTag, IF_NONE_MATCH};
use actix_web::{http, HttpMessage, HttpRequest, HttpResponse};
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

pub fn result_api<C: ConnectorTrait>(request: HttpRequest<C>) -> HttpResponse {
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

pub fn user_info_api<C: ConnectorTrait>(request: HttpRequest<C>) -> HttpResponse {
    let user_id = request.extract_user();
    request
        .state()
        .get_user_info(&user_id)
        .map(|user_info| HttpResponse::Ok().json(user_info))
        .unwrap_or_else(|_| HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Submission, UserInfo};
    use actix_web::test;

    #[derive(Clone)]
    struct MockConnector<F1, F2>
    where
        F1: Fn(&str) -> Result<Vec<Submission>, String>,
        F2: Fn(&str) -> Result<UserInfo, String>,
    {
        get_submissions: F1,
        get_user_info: F2,
    }

    impl<F1, F2> ConnectorTrait for MockConnector<F1, F2>
    where
        F1: Fn(&str) -> Result<Vec<Submission>, String>,
        F2: Fn(&str) -> Result<UserInfo, String>,
    {
        fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String> {
            (self.get_submissions)(user_id)
        }
        fn get_user_info(&self, user_id: &str) -> Result<UserInfo, String> {
            (self.get_user_info)(user_id)
        }
    }

    fn create_empty_submission() -> Submission {
        Submission {
            id: 0,
            epoch_second: 0,
            problem_id: "".to_owned(),
            contest_id: "".to_owned(),
            user_id: "".to_owned(),
            language: "".to_owned(),
            point: 0.0,
            length: 0,
            result: "".to_owned(),
            execution_time: None,
        }
    }

    fn create_test_server<C: ConnectorTrait + Clone + Send + 'static>(
        mock_connector: C,
    ) -> test::TestServer {
        test::TestServer::build_with_state(move || mock_connector.clone()).start(|app| {
            app.resource("/results", |r| r.method(http::Method::GET).with(result_api))
                .resource("/v2/user_info", |r| {
                    r.method(http::Method::GET).with(user_info_api)
                });
        })
    }

    #[test]
    fn test_result_api() {
        let mut srv = create_test_server(MockConnector {
            get_submissions: |user_id| {
                if user_id == "" {
                    Ok(Vec::new())
                } else {
                    let mut submission = create_empty_submission();
                    submission.user_id = user_id.to_owned();
                    Ok(vec![submission])
                }
            },
            get_user_info: |_| unimplemented!(),
        });

        fn request(srv: &mut test::TestServer, path: &str) -> Vec<Submission> {
            let request = srv.client(http::Method::GET, path).finish().unwrap();
            let response = srv.execute(request.send()).unwrap();
            srv.execute(response.json::<Vec<Submission>>()).unwrap()
        }

        let response: Vec<Submission> = request(&mut srv, "/results");
        assert!(response.is_empty());
        let response: Vec<Submission> = request(&mut srv, "/results?");
        assert!(response.is_empty());
        let response: Vec<Submission> = request(&mut srv, "/results?user");
        assert!(response.is_empty());
        let response: Vec<Submission> = request(&mut srv, "/results?user=");
        assert!(response.is_empty());
        let response: Vec<Submission> = request(&mut srv, "/results?use=a");
        assert!(response.is_empty());
        let response: Vec<Submission> = request(&mut srv, "/results?user=a");
        assert_eq!(response[0].user_id, "a");

        let request = srv
            .client(http::Method::GET, "/results?user=kenkoooo")
            .finish()
            .unwrap();
        let response = srv.execute(request.send()).unwrap();
        let etag = response.headers().get("etag").unwrap().to_str().unwrap();
        let request = srv
            .client(http::Method::GET, "/results?user=kenkoooo")
            .set_header(IF_NONE_MATCH, etag)
            .finish()
            .unwrap();
        let response = srv.execute(request.send()).unwrap();
        assert_eq!(response.status().as_u16(), 304);
    }

    #[test]
    fn test_user_info() {
        let mut srv = create_test_server(MockConnector {
            get_submissions: |_| unimplemented!(),
            get_user_info: |user_id| {
                Ok(UserInfo {
                    user_id: user_id.to_owned(),
                    accepted_count: 0,
                    accepted_count_rank: 0,
                    rated_point_sum: 0.0,
                    rated_point_sum_rank: 0,
                })
            },
        });

        fn request(srv: &mut test::TestServer, path: &str) -> UserInfo {
            let request = srv.client(http::Method::GET, path).finish().unwrap();
            let response = srv.execute(request.send()).unwrap();
            srv.execute(response.json::<UserInfo>()).unwrap()
        }

        let response = request(&mut srv, "/v2/user_info");
        assert_eq!(response.user_id, "");
        let response = request(&mut srv, "/v2/user_info?");
        assert_eq!(response.user_id, "");
        let response = request(&mut srv, "/v2/user_info?user");
        assert_eq!(response.user_id, "");
        let response = request(&mut srv, "/v2/user_info?user=");
        assert_eq!(response.user_id, "");
        let response = request(&mut srv, "/v2/user_info?use=a");
        assert_eq!(response.user_id, "");
        let response = request(&mut srv, "/v2/user_info?user=a");
        assert_eq!(response.user_id, "a");
    }
}
