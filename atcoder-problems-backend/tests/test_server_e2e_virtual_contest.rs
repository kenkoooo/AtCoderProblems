use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::server::{initialize_pool, run_server, Authentication};

use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::GitHubUserResponse;
use http_types::StatusCode;
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
            _ => Err(http_types::Error::from_str(StatusCode::Forbidden, "error")),
        }
    }
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse> {
        match token {
            VALID_TOKEN => Ok(GitHubUserResponse::default()),
            _ => Err(http_types::Error::from_str(StatusCode::Forbidden, "error")),
        }
    }
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql();
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[async_std::test]
async fn test_virtual_contest() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await?;
    let cookie_header = format!("token={}", VALID_TOKEN);

    let response = surf::post(url("/internal-api/user/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "atcoder_user_id": "atcoder_user1"
        }))?
        .await?;
    assert!(response.status().is_success());
    let mut response = surf::post(url("/internal-api/contest/create", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "title": "contest title",
            "memo": "contest memo",
            "start_epoch_second": 1,
            "duration_second": 2,
            "penalty_second": 0,
        }))?
        .await?;
    assert!(response.status().is_success());
    let body = response.body_json::<Value>().await?;
    let contest_id = body["contest_id"].as_str().unwrap();

    let response = surf::post(url("/internal-api/contest/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "id": format!("{}", contest_id),
            "title": "contest title",
            "memo": "contest memo",
            "start_epoch_second": 1,
            "duration_second": 2,
            "penalty_second": 300,
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/my", port))
        .set_header("Cookie", cookie_header.as_str())
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
                "mode": null,
                "is_public": true,
                "penalty_second": 300,
            }
        ])
    );

    let response = surf::get(url("/internal-api/contest/joined", port))
        .set_header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await?;
    assert_eq!(response, json!([]));

    let response = surf::post(url("/internal-api/contest/join", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/joined", port))
        .set_header("Cookie", cookie_header.as_str())
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
                "mode": null,
                "is_public": true,
                "penalty_second": 300,
            }
        ])
    );

    let response = surf::post(url("/internal-api/contest/leave", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/joined", port))
        .set_header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await?;
    assert_eq!(response, json!([]));

    let response = surf::post(url("/internal-api/contest/join", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/joined", port))
        .set_header("Cookie", cookie_header.as_str())
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
                "mode": null,
                "is_public": true,
                "penalty_second": 300,
            }
        ])
    );

    let response = surf::post(url("/internal-api/contest/item/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
            "problems": [{ "id": "problem_1", "point": 100 }],
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::post(url("/internal-api/contest/item/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
            "problems": [{ "id": "problem_1", "point": 100 }],
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::post(url("/internal-api/contest/item/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "contest_id": format!("{}", contest_id),
            "problems": [{ "id": "problem_1", "point": 100 }, { "id": "problem_2" }],
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/joined", port))
        .set_header("Cookie", cookie_header.as_str())
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
                "mode": null,
                "is_public": true,
                "penalty_second": 300,
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
        json!({
            "info": {
                "owner_user_id": "0",
                "duration_second": 2,
                "start_epoch_second": 1,
                "memo": "contest memo",
                "title": "contest title",
                "id": format!("{}", contest_id),
                "mode": null,
                "is_public": true,
                "penalty_second": 300,
            },
            "problems": [{ "id": "problem_1", "point": 100, "order": null }, { "id": "problem_2", "point": null, "order": null }],
            "participants": ["atcoder_user1"],
        })
    );

    let response = surf::get(url("/internal-api/contest/recent", port))
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
                "is_public": true,
                "id": format!("{}", contest_id),
                "mode": null,
                "penalty_second": 300,
            }
        ])
    );

    server.race(async_std::future::ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_virtual_contest_visibility() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;
    surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await?;
    let cookie_header = format!("token={}", VALID_TOKEN);

    let mut response = surf::post(url("/internal-api/contest/create", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "title": "visible",
            "memo": "",
            "start_epoch_second": 1,
            "duration_second": 2,
            "penalty_second": 300,
        }))?
        .await?;
    assert!(response.status().is_success());
    let body = response.body_json::<Value>().await?;
    let contest_id = body["contest_id"].as_str().unwrap();

    let response = surf::get(url("/internal-api/contest/recent", port))
        .recv_json::<Value>()
        .await?;
    assert_eq!(response[0]["id"].as_str().unwrap(), contest_id);
    assert_eq!(response.as_array().unwrap().len(), 1);

    let response = surf::post(url("/internal-api/contest/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "id": format!("{}", contest_id),
            "title": "invisible",
            "memo": "",
            "start_epoch_second": 1,
            "duration_second": 2,
            "is_public": false,
            "penalty_second": 300,
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/recent", port))
        .recv_json::<Value>()
        .await?;
    assert_eq!(response.as_array().unwrap().len(), 0);

    let mut response = surf::post(url("/internal-api/contest/create", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "title": "invisible",
            "memo": "",
            "start_epoch_second": 1,
            "duration_second": 2,
            "is_public": false,
            "penalty_second": 300,
        }))?
        .await?;
    assert!(response.status().is_success());
    let body = response.body_json::<Value>().await?;
    let contest_id = body["contest_id"].as_str().unwrap();

    let response = surf::get(url("/internal-api/contest/recent", port))
        .recv_json::<Value>()
        .await?;
    assert_eq!(response.as_array().unwrap().len(), 0);

    let response = surf::post(url("/internal-api/contest/update", port))
        .set_header("Cookie", cookie_header.as_str())
        .body_json(&json!({
            "id": contest_id,
            "title": "visible",
            "memo": "",
            "start_epoch_second": 1,
            "duration_second": 2,
            "is_public": true,
            "penalty_second": 300,
        }))?
        .await?;
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/contest/recent", port))
        .recv_json::<Value>()
        .await?;
    assert_eq!(response.as_array().unwrap().len(), 1);
    assert_eq!(response[0]["id"].as_str().unwrap(), contest_id);

    server.race(async_std::future::ready(())).await;
    Ok(())
}
