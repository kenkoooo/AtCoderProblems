use anyhow::Result;
use atcoder_problems_backend::server::{initialize_pool, run_server, Authentication};

use async_std::future::ready;
use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::GitHubUserResponse;
use rand::Rng;
use serde_json::{json, Value};
use std::collections::BTreeMap;

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
            _ => Err(anyhow::anyhow!("error")),
        }
    }
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse> {
        match token {
            VALID_TOKEN => Ok(GitHubUserResponse::default()),
            _ => Err(anyhow::anyhow!("error")),
        }
    }
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql().await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[async_std::test]
async fn test_list() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pool, pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    let cookie = response.header("set-cookie").unwrap();
    let token = cookie
        .as_str()
        .split(";")
        .next()
        .unwrap()
        .split("=")
        .skip(1)
        .next()
        .unwrap();
    assert_eq!(token, VALID_TOKEN);

    let response = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .recv_string()
        .await
        .unwrap();
    assert_eq!(&response, "[]");

    let mut response = surf::post(url("/internal-api/list/create", port))
        .header("Cookie", format!("token={}", token))
        .body(json!({"list_name":"a"}))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value: Value = response.body_json().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        response,
        json!([
            {
                "internal_list_id": internal_list_id,
                "internal_user_id": "0",
                "internal_list_name": "a",
                "items": []
            }
        ])
    );

    let response = surf::post(url("/internal-api/list/update", port))
        .header("Cookie", format!("token={}", token))
        .body(json!({
            "internal_list_id":internal_list_id,
            "name":"b"
        }))
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        response,
        json!([
            {
                "internal_list_id": internal_list_id,
                "internal_user_id": "0",
                "internal_list_name": "b",
                "items": []
            }
        ])
    );

    let response = surf::get(url(
        &format!("/internal-api/list/get/{}", internal_list_id),
        port,
    ))
    .recv_json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!(
        {
            "internal_list_id": internal_list_id,
            "internal_user_id": "0",
            "internal_list_name": "b",
            "items": []
        })
    );

    let response = surf::post(url("/internal-api/list/delete", port))
        .header("Cookie", format!("token={}", token))
        .body(json!({ "internal_list_id": internal_list_id }))
        .await
        .unwrap();
    assert!(response.status().is_success());

    let response = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .recv_string()
        .await
        .unwrap();
    assert_eq!(&response, "[]");
    server.race(ready(())).await;
}
#[async_std::test]
async fn test_invalid_token() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pool, pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", "token=invalid-token")
        .await
        .unwrap();
    assert!(!response.status().is_success());

    let mut map = BTreeMap::new();
    map.insert("list_name", "a");
    let response = surf::post(url("/internal-api/list/create", port))
        .header("Cookie", "token=invalid-token")
        .await
        .unwrap();
    assert!(!response.status().is_success());

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_list_item() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pool, pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    let cookie_header = format!("token={}", VALID_TOKEN);

    let mut response = surf::post(url("/internal-api/list/create", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({"list_name":"a"}))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value: Value = response.body_json().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = surf::post(url("/internal-api/list/item/add", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({
            "internal_list_id": internal_list_id,
            "internal_user_id": "0",
            "problem_id": "problem_1"
        }))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        list,
        json!([
            {
                "internal_list_id": internal_list_id,
                "internal_list_name": "a",
                "internal_user_id": "0",
                "items": [{"problem_id": "problem_1", "memo":""}]
            }
        ])
    );

    let response = surf::post(url("/internal-api/list/item/update", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1",
            "internal_user_id": "0",
            "memo": "memo_1"
        }))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        list,
        json!([
            {
                "internal_list_id": internal_list_id,
                "internal_list_name": "a",
                "internal_user_id": "0",
                "items": [{"problem_id": "problem_1", "memo":"memo_1"}]
            }
        ])
    );

    let response = surf::post(url("/internal-api/list/item/delete", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1"
        }))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        list,
        json!([
            {
                "internal_list_id": internal_list_id,
                "internal_list_name": "a",
                "internal_user_id": "0",
                "items": []
            }
        ])
    );

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_list_delete() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pool, pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    let cookie_header = format!("token={}", VALID_TOKEN);

    let mut response = surf::post(url("/internal-api/list/create", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({"list_name":"a"}))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value: Value = response.body_json().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = surf::post(url("/internal-api/list/item/add", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({"internal_list_id":internal_list_id, "problem_id":"problem_1"}))
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(list[0]["items"][0]["problem_id"], "problem_1", "{:?}", list);
    assert_eq!(list[0]["items"][0]["memo"], "", "{:?}", list);

    let response = surf::post(url("/internal-api/list/delete", port))
        .header("Cookie", cookie_header.as_str())
        .body(json!({ "internal_list_id": internal_list_id }))
        .await
        .unwrap();
    assert!(response.status().is_success());

    let list = surf::get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .recv_json::<Value>()
        .await
        .unwrap();
    assert!(list.as_array().unwrap().is_empty());

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_register_twice() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pool, pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 302);

    let response = surf::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 302);
    server.race(ready(())).await;
}
