use actix_web::test;
use atcoder_problems_backend::server::middleware::github_auth::{
    GithubAuthentication, GithubClient, GithubToken,
};
use rand::Rng;
use reqwest::header::SET_COOKIE;
use serde_json::{json, Value};

pub mod utils;

const VALID_CODE: &str = "valid-code";
const VALID_TOKEN: &str = "valid-token";

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql().await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[actix_web::test]
async fn test_list() {
    let port = setup().await;
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();
    let server = actix_web::rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        let github =
            GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();
        actix_web::HttpServer::new(move || {
            actix_web::App::new()
                .wrap(GithubAuthentication::new(github.clone()))
                .app_data(actix_web::web::Data::new(pg_pool.clone()))
                .app_data(actix_web::web::Data::new(github.clone()))
                .configure(atcoder_problems_backend::server::config_services)
        })
        .bind(("0.0.0.0", port))
        .unwrap()
        .run()
        .await
        .unwrap();
    });
    actix_web::rt::time::sleep(std::time::Duration::from_millis(1000)).await;

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
    assert!(response.status().is_redirection());
    // https://docs.rs/reqwest/latest/reqwest/struct.Response.html#method.cookies
    // これを使ったほうがいいかもしれない
    let cookie = response.headers().get(SET_COOKIE).unwrap();
    let token = cookie
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .split('=')
        .nth(1)
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
#[actix_web::test]
async fn test_invalid_token() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let github =
        GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();

    let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
        .await
        .unwrap();

    let app = test::init_service(
        actix_web::App::new()
            .wrap(GithubAuthentication::new(github.clone()))
            .app_data(actix_web::web::Data::new(github))
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", "token=invalid-token"))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(!response.status().is_success());

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", "token=invalid-token"))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(!response.status().is_success());
}

#[actix_web::test]
async fn test_list_item() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
        .await
        .unwrap();
    let github =
        GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();

    let app = test::init_service(
        actix_web::App::new()
            .wrap(GithubAuthentication::new(github.clone()))
            .app_data(actix_web::web::Data::new(github))
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .to_request();
    test::call_service(&app, request).await;

    let cookie_header = format!("token={}", VALID_TOKEN);

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"list_name":"a"}))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    let internal_list_id = response["internal_list_id"].as_str().unwrap();

    let request = test::TestRequest::post()
        .uri("/internal-api/list/item/add")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "internal_user_id": "0",
            "problem_id": "problem_1"
        }))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(response.status().is_success(), "{:?}", response);

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

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
    let request = test::TestRequest::post()
        .uri("/internal-api/list/item/update")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1",
            "internal_user_id": "0",
            "memo": "memo_1"
        }))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(response.status().is_success(), "{:?}", response);

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

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

    let request = test::TestRequest::post()
        .uri("/internal-api/list/item/delete")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1"
        }))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(response.status().is_success(), "{:?}", response);

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

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
}

#[actix_web::test]
async fn test_list_delete() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
        .await
        .unwrap();
    let github =
        GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();

    let app = test::init_service(
        actix_web::App::new()
            .wrap(GithubAuthentication::new(github.clone()))
            .app_data(actix_web::web::Data::new(github))
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .to_request();
    test::call_service(&app, request).await;

    let cookie_header = format!("token={}", VALID_TOKEN);

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"list_name":"a"}))
        .to_request();
    let value: Value = test::call_and_read_body_json(&app, request).await;

    let internal_list_id = value["internal_list_id"].as_str().unwrap();

    let request = test::TestRequest::post()
        .uri("/internal-api/list/item/add")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"internal_list_id":internal_list_id, "problem_id":"problem_1"}))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(response.status().is_success(), "{:?}", response);

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(list[0]["items"][0]["problem_id"], "problem_1", "{:?}", list);
    assert_eq!(list[0]["items"][0]["memo"], "", "{:?}", list);

    let request = test::TestRequest::post()
        .uri("/internal-api/list/delete")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({ "internal_list_id": internal_list_id }))
        .to_request();
    let response = test::call_service(&app, request).await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

    assert!(list.as_array().unwrap().is_empty());
}

#[actix_web::test]
async fn test_register_twice() {
    let port = setup().await;
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();
    let server = actix_web::rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        let github =
            GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();
        actix_web::HttpServer::new(move || {
            actix_web::App::new()
                .wrap(GithubAuthentication::new(github.clone()))
                .app_data(actix_web::web::Data::new(github.clone()))
                .app_data(actix_web::web::Data::new(pg_pool.clone()))
                .configure(atcoder_problems_backend::server::config_services)
        })
        .bind(("0.0.0.0", port))
        .unwrap()
        .run()
        .await
        .unwrap();
    });
    actix_web::rt::time::sleep(std::time::Duration::from_millis(1000)).await;

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
