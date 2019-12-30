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
    simple_logger::init_with_level(log::Level::Info).unwrap();
    task::block_on(async {
        let port = setup();
        let server = utils::start_server_handle(MockAuth, port);
        let client = utils::run_client_handle(async move {
            surf::get(url(
                &format!("/internal-api/authorize?code={}", VALID_CODE),
                port,
            ))
            .await?;
            let cookie_header = format!("token={}", VALID_TOKEN);

            let response = surf::post(url("/internal-api/user/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                        "atcoder_user_id": "atcoder_user1"
                }))?
                .await?;
            assert!(response.status().is_success());
            let mut response = surf::post(url("/internal-api/contest/create", port))
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

            let response = surf::post(url("/internal-api/contest/update", port))
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

            let response = surf::get(url("/internal-api/contest/my", port))
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
                        "problems": [],
                        "mode": null
                    }
                ])
            );

            let response = surf::get(url("/internal-api/contest/joined", port))
                .set_header("Cookie", &cookie_header)
                .recv_json::<Value>()
                .await?;
            assert_eq!(response, json!([]));

            let response = surf::post(url("/internal-api/contest/join", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/internal-api/contest/joined", port))
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
                        "participants": ["atcoder_user1"],
                        "problems": [],
                        "mode": null
                    }
                ])
            );

            let response = surf::post(url("/internal-api/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problems": [{"id":"problem_1", "point":100}],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::post(url("/internal-api/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problems": [{"id":"problem_1", "point":100}],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::post(url("/internal-api/contest/item/update", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&json!({
                    "contest_id": format!("{}", contest_id),
                    "problems": [{"id":"problem_1", "point":100}, {"id": "problem_2"}],
                }))?
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/internal-api/contest/joined", port))
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
                        "participants": ["atcoder_user1"],
                        "problems": [{"id":"problem_1", "point":100, "order":null}, {"id": "problem_2", "point":null, "order":null}],
                        "mode":null,
                    }
                ])
            );

            let response = surf::get(url(
                &format!("/internal-api/contest/get/{}", contest_id),
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
                    "participants": ["atcoder_user1"],
                    "problems": [{"id":"problem_1", "point":100, "order":null}, {"id": "problem_2", "point":null, "order":null}],
                    "mode":null,
                })
            );

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
