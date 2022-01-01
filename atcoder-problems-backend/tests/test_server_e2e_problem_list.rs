use actix_web::Result;
use async_trait::async_trait;
use atcoder_problems_backend::server::{run_server, Authentication, GitHubUserResponse};
use rand::Rng;
use reqwest::header::SET_COOKIE;
use serde_json::{json, Value};

pub mod utils;

#[derive(Clone)]
struct MockAuth;

const VALID_CODE: &str = "VALID-CODE";
const VALID_TOKEN: &str = "VALID-TOKEN";

#[async_trait(?Send)]
impl Authentication for MockAuth {
    async fn get_token(&self, code: &str) -> Result<String> {
        match code {
            VALID_CODE => Ok(VALID_TOKEN.to_owned()),
            _ => Err(actix_web::error::ErrorNotFound("error")),
        }
    }
    async fn get_user_id(&self, token: &str) -> Result<GitHubUserResponse> {
        match token {
            VALID_TOKEN => Ok(GitHubUserResponse::default()),
            _ => Err(actix_web::error::ErrorNotFound("error")),
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

#[tokio::test]
async fn test_list() {
    let port = setup().await;
    let server = actix_rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let response = client
        .get(url(
            &format!("/internal-api/authorize?code={}", VALID_CODE),
            port,
        ))
        .send()
        .await
        .unwrap();
    // https://docs.rs/reqwest/latest/reqwest/struct.Response.html#method.cookies
    // これを使ったほうがいいかもしれない
    let cookie = response.headers().get(SET_COOKIE).unwrap();
    let token = cookie
        .to_str()
        .unwrap()
        .split(";")
        .next()
        .unwrap()
        .split("=")
        .skip(1)
        .next()
        .unwrap();
    assert_eq!(token, VALID_TOKEN);

    let response = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .text()
        .await
        .unwrap();
    assert_eq!(&response, "[]");

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/create", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({"list_name":"a"}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value = response.json::<Value>().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/update", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({
            "internal_list_id":internal_list_id,
            "name":"b"
        }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::get(url(
        &format!("/internal-api/list/get/{}", internal_list_id),
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/delete", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({ "internal_list_id": internal_list_id }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());

    let response = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .text()
        .await
        .unwrap();
    assert_eq!(&response, "[]");

    server.abort();
    server.await.unwrap_err();
}
#[tokio::test]
async fn test_invalid_token() {
    let port = setup().await;
    let server = actix_rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    let response = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", "token=invalid-token")
        .send()
        .await
        .unwrap();
    assert!(!response.status().is_success());

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/create", port))
        .header("Cookie", "token=invalid-token")
        .send()
        .await
        .unwrap();
    assert!(!response.status().is_success());

    server.abort();
    server.await.unwrap_err();
}

#[tokio::test]
async fn test_list_item() {
    let port = setup().await;
    let server = actix_rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    reqwest::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    let cookie_header = format!("token={}", VALID_TOKEN);

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/create", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({"list_name":"a"}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value = response.json::<Value>().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/item/add", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({
            "internal_list_id": internal_list_id,
            "internal_user_id": "0",
            "problem_id": "problem_1"
        }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list: Value = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/item/update", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1",
            "internal_user_id": "0",
            "memo": "memo_1"
        }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/item/delete", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1"
        }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    server.abort();
    server.await.unwrap_err();
}

#[tokio::test]
async fn test_list_delete() {
    let port = setup().await;
    let server = actix_rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    reqwest::get(url(
        &format!("/internal-api/authorize?code={}", VALID_CODE),
        port,
    ))
    .await
    .unwrap();
    let cookie_header = format!("token={}", VALID_TOKEN);

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/create", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({"list_name":"a"}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let value = response.json::<Value>().await.unwrap();
    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/item/add", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({"internal_list_id":internal_list_id, "problem_id":"problem_1"}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success(), "{:?}", response);
    let list = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .send()
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(list[0]["items"][0]["problem_id"], "problem_1", "{:?}", list);
    assert_eq!(list[0]["items"][0]["memo"], "", "{:?}", list);

    let response = reqwest::Client::new()
        .post(url("/internal-api/list/delete", port))
        .header("Cookie", cookie_header.as_str())
        .json(&json!({ "internal_list_id": internal_list_id }))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());

    let list = reqwest::Client::new()
        .get(url("/internal-api/list/my", port))
        .header("Cookie", cookie_header.as_str())
        .send()
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert!(list.as_array().unwrap().is_empty());

    server.abort();
    server.await.unwrap_err();
}

#[tokio::test]
async fn test_register_twice() {
    let port = setup().await;
    let server = actix_rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let response = client
        .get(url(
            &format!("/internal-api/authorize?code={}", VALID_CODE),
            port,
        ))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 302);

    let response = client
        .get(url(
            &format!("/internal-api/authorize?code={}", VALID_CODE),
            port,
        ))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 302);

    server.abort();
    server.await.unwrap_err();
}
