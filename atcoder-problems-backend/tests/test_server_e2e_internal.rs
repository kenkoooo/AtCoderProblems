use atcoder_problems_backend::error::{Error, Result};
use atcoder_problems_backend::server::Authentication;

use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use rand::Rng;
use serde_json::Value;
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
            _ => Err(Error::OtherError),
        }
    }
    async fn get_user_id(&self, token: &str) -> Result<String> {
        match token {
            VALID_TOKEN => Ok("user_name".to_owned()),
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
fn test_list() {
    task::block_on(async {
        let port = setup();
        let server = utils::start_server_handle(MockAuth, port);
        let client = utils::run_client_handle(async move {
            let response = surf::get(url(
                &format!("/atcoder-api/v3/authorize?code={}", VALID_CODE),
                port,
            ))
            .await?;
            let cookie = response.header("set-cookie").unwrap();
            let token = cookie
                .split(";")
                .next()
                .unwrap()
                .split("=")
                .skip(1)
                .next()
                .unwrap();
            assert_eq!(token, VALID_TOKEN);

            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .recv_string()
                .await?;
            assert_eq!(&response, "[]");

            let mut map = BTreeMap::new();
            map.insert("list_name", "a");
            let mut response = surf::post(url("/atcoder-api/v3/internal/list/create", port))
                .set_header("Cookie", format!("token={}", token))
                .body_json(&map)
                .unwrap()
                .await?;
            assert!(response.status().is_success(), "{:?}", response);
            let value: Value = response.body_json().await?;
            let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .recv_json::<Value>()
                .await?;
            let expected: Value = serde_json::from_str(&format!(
                r#"[{{
                    "internal_list_id": "{}",
                    "internal_list_name": "a",
                    "items": []
                    }}]"#,
                internal_list_id
            ))
            .unwrap();
            assert_eq!(response, expected);

            let mut map = BTreeMap::new();
            map.insert("internal_list_id", internal_list_id);
            map.insert("name", "b");
            let response = surf::post(url("/atcoder-api/v3/internal/list/update", port))
                .set_header("Cookie", format!("token={}", token))
                .body_json(&map)
                .unwrap()
                .await?;
            assert!(response.status().is_success());
            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .recv_json::<Value>()
                .await?;
            let expected: Value = serde_json::from_str(&format!(
                r#"[{{
                    "internal_list_id": "{}",
                    "internal_list_name": "b",
                    "items": []
                    }}]"#,
                internal_list_id
            ))
            .unwrap();
            assert_eq!(response, expected);

            let mut map = BTreeMap::new();
            map.insert("internal_list_id", &internal_list_id);
            let response = surf::post(url("/atcoder-api/v3/internal/list/delete", port))
                .set_header("Cookie", format!("token={}", token))
                .body_json(&map)
                .unwrap()
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .recv_string()
                .await?;
            assert_eq!(&response, "[]");

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
#[test]
fn test_invalid_token() {
    task::block_on(async {
        let port = setup();
        let server = utils::start_server_handle(MockAuth, port);
        let client = utils::run_client_handle(async move {
            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", "token=invalid-token")
                .await?;
            assert!(!response.status().is_success());

            let mut map = BTreeMap::new();
            map.insert("list_name", "a");
            let response = surf::post(url("/atcoder-api/v3/internal/list/create", port))
                .set_header("Cookie", "token=invalid-token")
                .await?;
            assert!(!response.status().is_success());

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}

#[test]
fn test_list_item() {
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

            let mut map = BTreeMap::new();
            map.insert("list_name", "a");
            let mut response = surf::post(url("/atcoder-api/v3/internal/list/create", port))
                .set_header("Cookie", &cookie_header)
                .body_json(&map)
                .unwrap()
                .await?;
            assert!(response.status().is_success(), "{:?}", response);
            let value: Value = response.body_json().await?;
            let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
