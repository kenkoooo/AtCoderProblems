use atcoder_problems_backend::error::{Error, Result};
use atcoder_problems_backend::server::Authentication;

use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::GitHubUserResponse;
use rand::Rng;
use serde_json::{json, Value};

pub mod utils;

#[derive(Clone)]
struct MockAuth;

const VALID_CODE: &str = "VALID-CODE";
const VALID_TOKEN: &str = "VALID-TOKEN";

#[async_trait]
impl Authentication for MockAuth {
    async fn get_token(&self, code: &str) -> Result<String> {
        match code {
            VALID_CODE => Ok(VALID_TOKEN.to_owned()),
            _ => Err(Error::OtherError),
        }
    }
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse> {
        match token {
            VALID_TOKEN => Ok(GitHubUserResponse::default()),
            _ => Err(Error::OtherError),
        }
    }
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

fn setup() -> u16 {
    utils::connect_to_test_sql();
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[test]
fn test_virtual_contest() {
    task::block_on(async {
        let port = setup();
        let server = utils::start_server_handle(MockAuth, port);
        let client = utils::run_client_handle(async move {
            surf::get(url(
                &format!("/atcoder-api/v3/authorize?code={}", VALID_CODE),
                port,
            ))
            .await?;
            let cookie_header = format!("token={}", VALID_TOKEN);

            let mut response = surf::post(url("/atcoder-api/v3/internal/contest/create", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "title":"contest title",
                    "memo": "contest memo",
                    "start_epoch_second": 1,
                    "duration_second": 2
                }))?
                .await?;
            assert!(response.status().is_success());
            let body = response.body_json::<Value>().await?;
            let contest_id = body["contest_id"].as_str().unwrap();

            let response = surf::post(url("/atcoder-api/v3/internal/contest/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "id": format!("{}", contest_id),
                    "title":"contest title",
                    "memo": "contest memo",
                    "start_epoch_second": 1,
                    "duration_second": 2
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/atcoder-api/v3/internal/contest/my", port))
                .set_header("Cookie", &cookie_header)
                .recv_json::<Value>()
                .await?;
            assert_eq!(
                response,
                json!([
                    {
                        "owner_user_id": "0",
                        "duration_second": 2,
                        "start_epoch_second": 1,
                        "memo": "contest memo",
                        "title": "contest title",
                        "id": format!("{}", contest_id),
                        "participants": [],
                        "problems": []
                    }
                ])
            );

            let response = surf::get(url("/atcoder-api/v3/internal/contest/joined", port))
                .set_header("Cookie", &cookie_header)
                .recv_json::<Value>()
                .await?;
            assert_eq!(response, json!([]));

            let response = surf::post(url("/atcoder-api/v3/internal/contest/join", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/atcoder-api/v3/internal/contest/joined", port))
                .set_header("Cookie", &cookie_header)
                .recv_json::<Value>()
                .await?;
            assert_eq!(
                response,
                json!([
                    {
                        "owner_user_id": "0",
                        "duration_second": 2,
                        "start_epoch_second": 1,
                        "memo": "contest memo",
                        "title": "contest title",
                        "id": format!("{}", contest_id),
                        "participants": ["0"],
                        "problems": []
                    }
                ])
            );

            let response = surf::post(url("/atcoder-api/v3/internal/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problem_ids": ["problem_1"],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::post(url("/atcoder-api/v3/internal/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problem_ids": ["problem_1"],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::post(url("/atcoder-api/v3/internal/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problem_ids": ["problem_2"],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/atcoder-api/v3/internal/contest/joined", port))
                .set_header("Cookie", &cookie_header)
                .recv_json::<Value>()
                .await?;
            assert_eq!(
                response,
                json!([
                    {
                        "owner_user_id": "0",
                        "duration_second": 2,
                        "start_epoch_second": 1,
                        "memo": "contest memo",
                        "title": "contest title",
                        "id": format!("{}", contest_id),
                        "participants": ["0"],
                        "problems": ["problem_2"]
                    }
                ])
            );

            let response = surf::get(url(
                &format!("/atcoder-api/v3/internal/contest/get/{}", contest_id),
                port,
            ))
            .recv_json::<Value>()
            .await?;
            assert_eq!(
                response,
                json!(
                {
                    "owner_user_id": "0",
                    "duration_second": 2,
                    "start_epoch_second": 1,
                    "memo": "contest memo",
                    "title": "contest title",
                    "id": format!("{}", contest_id),
                    "participants": ["0"],
                    "problems": ["problem_2"]
                })
            );

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
