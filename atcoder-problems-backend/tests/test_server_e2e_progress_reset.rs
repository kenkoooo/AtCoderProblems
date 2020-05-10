use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::error::{Error, Result};
use atcoder_problems_backend::server::{
    initialize_pool, run_server, Authentication, GitHubUserResponse,
};
use rand::Rng;
use serde_json::{json, Value};
use std::time::Duration;

pub mod utils;

#[derive(Clone)]
struct MockAuth;
#[async_trait]
impl Authentication for MockAuth {
    async fn get_token(&self, code: &str) -> Result<String> {
        Ok(String::new())
    }

    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse> {
        Ok(GitHubUserResponse::default())
    }
}

fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql();
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

#[async_std::test]
async fn test_progress_reset() -> Result<()> {
    let port = setup();
    let server = async_std::task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(Duration::from_millis(1000)).await;

    let response = surf::get(url("/internal-api/authorize?code=a", port)).await?;
    assert_eq!(response.status(), 302);

    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .set_header("Cookie", "token=a")
        .recv_json::<Value>()
        .await?;
    assert_eq!(
        response,
        json!({
        "items":[]
        })
    );

    let response = surf::post(url("/internal-api/progress_reset/add", port))
        .set_header("Cookie", "token=a")
        .body_json(&json!({"problem_id":"problem_1","reset_epoch_second":100}))?
        .await?;
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .set_header("Cookie", "token=a")
        .recv_json::<Value>()
        .await?;
    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_1",
                "reset_epoch_second": 100
            }]
        })
    );

    let response = surf::post(url("/internal-api/progress_reset/add", port))
        .set_header("Cookie", "token=a")
        .body_json(&json!({"problem_id":"problem_1","reset_epoch_second":200}))?
        .await?;
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .set_header("Cookie", "token=a")
        .recv_json::<Value>()
        .await?;
    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_1",
                "reset_epoch_second": 200
            }]
        })
    );

    let response = surf::post(url("/internal-api/progress_reset/add", port))
        .set_header("Cookie", "token=a")
        .body_json(&json!({"problem_id":"problem_2","reset_epoch_second":200}))?
        .await?;
    assert!(response.status().is_success());
    let response = surf::post(url("/internal-api/progress_reset/delete", port))
        .set_header("Cookie", "token=a")
        .body_json(&json!({"problem_id":"problem_1"}))?
        .await?;
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .set_header("Cookie", "token=a")
        .recv_json::<Value>()
        .await?;
    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_2",
                "reset_epoch_second": 200
            }]
        })
    );

    server.race(async_std::future::ready(())).await;
    Ok(())
}
