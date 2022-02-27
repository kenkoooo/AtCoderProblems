use actix_web::{http::StatusCode, test};
use atcoder_problems_backend::server::middleware::github_auth::{
    GithubAuthentication, GithubClient, GithubToken,
};
use reqwest::header::SET_COOKIE;
use serde_json::{json, Value};

pub mod utils;

const VALID_CODE: &str = "valid-code";
const VALID_TOKEN: &str = "valid-token";

#[actix_web::test]
async fn test_list() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let pg_pool = utils::initialize_and_connect_to_test_sql().await;

    let github =
        GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();

    let app = test::init_service(
        actix_web::App::new()
            .wrap(GithubAuthentication::new(github.clone()))
            .app_data(actix_web::web::Data::new(pg_pool))
            .app_data(actix_web::web::Data::new(github))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let response = test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .send_request(&app)
        .await;

    assert!(response.status().is_redirection());

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

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", format!("token={}", token)))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response, json!([]));

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", format!("token={}", token)))
        .set_json(json!({"list_name":"a"}))
        .to_request();
    let value: Value = test::call_and_read_body_json(&app, request).await;

    let internal_list_id = value.get("internal_list_id").unwrap().as_str().unwrap();

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", format!("token={}", token)))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

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

    let response = test::TestRequest::post()
        .uri("/internal-api/list/update")
        .insert_header(("Cookie", format!("token={}", token)))
        .set_json(json!({
            "internal_list_id":internal_list_id,
            "name":"b"
        }))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", format!("token={}", token)))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

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

    let request = test::TestRequest::get()
        .uri(&format!("/internal-api/list/get/{}", internal_list_id))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

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

    let response = test::TestRequest::post()
        .uri("/internal-api/list/delete")
        .insert_header(("Cookie", format!("token={}", token)))
        .set_json(json!({ "internal_list_id": internal_list_id }))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", format!("token={}", token)))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response, json!([]));
}
#[actix_web::test]
async fn test_invalid_token() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let github =
        GithubClient::new("", "", &mock_server_base_url, &mock_api_server_base_url).unwrap();

    let pg_pool = utils::initialize_and_connect_to_test_sql().await;

    let app = test::init_service(
        actix_web::App::new()
            .wrap(GithubAuthentication::new(github.clone()))
            .app_data(actix_web::web::Data::new(github))
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let response = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", "token=invalid-token"))
        .send_request(&app)
        .await;

    assert!(!response.status().is_success());

    let response = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", "token=invalid-token"))
        .send_request(&app)
        .await;

    assert!(!response.status().is_success());
}

#[actix_web::test]
async fn test_list_item() {
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let pg_pool = utils::initialize_and_connect_to_test_sql().await;

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

    test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .send_request(&app)
        .await;

    let cookie_header = format!("token={}", VALID_TOKEN);

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"list_name":"a"}))
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    let internal_list_id = response["internal_list_id"].as_str().unwrap();

    let response = test::TestRequest::post()
        .uri("/internal-api/list/item/add")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "internal_user_id": "0",
            "problem_id": "problem_1"
        }))
        .send_request(&app)
        .await;

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
    let response = test::TestRequest::post()
        .uri("/internal-api/list/item/update")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1",
            "internal_user_id": "0",
            "memo": "memo_1"
        }))
        .send_request(&app)
        .await;

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

    let response = test::TestRequest::post()
        .uri("/internal-api/list/item/delete")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({
            "internal_list_id": internal_list_id,
            "problem_id": "problem_1"
        }))
        .send_request(&app)
        .await;

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

    let pg_pool = utils::initialize_and_connect_to_test_sql().await;

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

    test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .send_request(&app)
        .await;

    let cookie_header = format!("token={}", VALID_TOKEN);

    let request = test::TestRequest::post()
        .uri("/internal-api/list/create")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"list_name":"a"}))
        .to_request();
    let value: Value = test::call_and_read_body_json(&app, request).await;

    let internal_list_id = value["internal_list_id"].as_str().unwrap();

    let response = test::TestRequest::post()
        .uri("/internal-api/list/item/add")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({"internal_list_id":internal_list_id, "problem_id":"problem_1"}))
        .send_request(&app)
        .await;

    assert!(response.status().is_success(), "{:?}", response);

    let request = test::TestRequest::get()
        .uri("/internal-api/list/my")
        .insert_header(("Cookie", cookie_header.as_str()))
        .to_request();
    let list: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(list[0]["items"][0]["problem_id"], "problem_1", "{:?}", list);
    assert_eq!(list[0]["items"][0]["memo"], "", "{:?}", list);

    let response = test::TestRequest::post()
        .uri("/internal-api/list/delete")
        .insert_header(("Cookie", cookie_header.as_str()))
        .set_json(json!({ "internal_list_id": internal_list_id }))
        .send_request(&app)
        .await;

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
    let mock_server = utils::start_mock_github_server(VALID_TOKEN);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(VALID_TOKEN, GithubToken { id: 0 });
    let mock_api_server_base_url = mock_api_server.base_url();

    let pg_pool = utils::initialize_and_connect_to_test_sql().await;

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

    let response = test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::FOUND);

    let response = test::TestRequest::get()
        .uri(&format!("/internal-api/authorize?code={}", VALID_CODE))
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::FOUND);
}
