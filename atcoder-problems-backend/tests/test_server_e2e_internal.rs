use atcoder_problems_backend::error::{Error, Result};
use atcoder_problems_backend::server::{initialize_pool, run_server, Authentication};

use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use diesel::{insert_into, ExpressionMethods, PgConnection, RunQueryDsl};
use rand::Rng;
use serde_json::Value;
use std::collections::BTreeMap;
use std::future::Future;

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

fn start_server_handle(port: u16) -> task::JoinHandle<std::result::Result<(), surf::Exception>> {
    task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        let auth = MockAuth;
        run_server(pool, auth, port).await.unwrap();
        Ok(())
    })
}

fn run_client_handle<F>(future: F) -> task::JoinHandle<std::result::Result<(), surf::Exception>>
where
    F: Future<Output = std::result::Result<(), surf::Exception>> + Send + 'static,
{
    task::spawn(async {
        task::sleep(std::time::Duration::from_millis(1000)).await;
        future.await
    })
}

#[test]
fn test_list() {
    task::block_on(async {
        let port = setup();
        let server = start_server_handle(port);
        let client = run_client_handle(async move {
            let response = surf::get(url(
                &format!("/atcoder-api/v3/authorize?code={}", VALID_CODE),
                port,
            ))
            .await?;
            let cookie = response.header("set-cookie").unwrap();
            let token = cookie.split("=").skip(1).next().unwrap();

            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .await?;
            assert!(response.status().is_success());

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
            assert_eq!(
                response
                    .get(0)
                    .unwrap()
                    .get("internal_list_id")
                    .unwrap()
                    .as_str(),
                Some(internal_list_id)
            );
            assert_eq!(
                response
                    .get(0)
                    .unwrap()
                    .get("internal_list_name")
                    .unwrap()
                    .as_str(),
                Some("a")
            );
            assert!(response
                .get(0)
                .unwrap()
                .get("items")
                .unwrap()
                .as_array()
                .unwrap()
                .is_empty());

            let mut map = BTreeMap::new();
            map.insert("internal_list_id", internal_list_id);
            let response = surf::post(url("/atcoder-api/v3/internal/list/delete", port))
                .set_header("Cookie", format!("token={}", token))
                .body_json(&map)
                .unwrap()
                .await?;
            assert!(response.status().is_success());

            let response = surf::get(url("/atcoder-api/v3/internal/list/get", port))
                .set_header("Cookie", format!("token={}", token))
                .recv_json::<Value>()
                .await?;
            assert!(response.as_array().unwrap().is_empty());

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
