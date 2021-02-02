use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::{run_server, Authentication, GitHubUserResponse};
use rand::Rng;
use serde_json::{json, Value};
use std::time::Duration;
use tide::Result;

pub mod utils;

#[derive(Clone)]
struct MockAuth;
#[async_trait]
impl Authentication for MockAuth {
    async fn get_token(&self, _: &str) -> Result<String> {
        Ok(String::new())
    }

    async fn get_user_id(&self, _: &str) -> Result<GitHubUserResponse> {
        Ok(GitHubUserResponse::default())
    }
}

async fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql().await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

#[async_std::test]
async fn test_progress_reset() {
    let port = setup().await;
    let server = async_std::task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(Duration::from_millis(1000)).await;

    let response = surf::get(url("/internal-api/authorize?code=a", port))
        .await
        .unwrap();
    assert_eq!(response.status(), 302);

    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", "token=a")
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        response,
        json!({
        "items":[]
        })
    );

    let response = surf::post(url("/internal-api/progress_reset/add", port))
        .header("Cookie", "token=a")
        .body(json!({"problem_id":"problem_1","reset_epoch_second":100}))
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", "token=a")
        .recv_json::<Value>()
        .await
        .unwrap();
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
        .header("Cookie", "token=a")
        .body(json!({"problem_id":"problem_1","reset_epoch_second":200}))
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", "token=a")
        .recv_json::<Value>()
        .await
        .unwrap();
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
        .header("Cookie", "token=a")
        .body(json!({"problem_id":"problem_2","reset_epoch_second":200}))
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = surf::post(url("/internal-api/progress_reset/delete", port))
        .header("Cookie", "token=a")
        .body(json!({"problem_id":"problem_1"}))
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", "token=a")
        .recv_json::<Value>()
        .await
        .unwrap();
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
}
