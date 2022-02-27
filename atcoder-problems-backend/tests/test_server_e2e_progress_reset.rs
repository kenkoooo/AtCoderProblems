use actix_web::{cookie::Cookie, http::StatusCode, test};
use atcoder_problems_backend::server::middleware::github_auth::{
    GithubAuthentication, GithubClient, GithubToken,
};
use serde_json::{json, Value};

pub mod utils;

#[actix_web::test]
async fn test_progress_reset() {
    let token = "access_token";
    let mock_server = utils::start_mock_github_server(token);
    let mock_server_base_url = mock_server.base_url();
    let mock_api_server = utils::start_mock_github_api_server(token, GithubToken { id: 0 });
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
        .uri("/internal-api/authorize?code=a")
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::FOUND);

    let cookie = Cookie::new("token", token);

    let request = test::TestRequest::get()
        .uri("/internal-api/progress_reset/list")
        .cookie(cookie.clone())
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
        "items":[]
        })
    );

    let response = test::TestRequest::post()
        .uri("/internal-api/progress_reset/add")
        .cookie(cookie.clone())
        .set_json(json!({"problem_id":"problem_1","reset_epoch_second":100}))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/progress_reset/list")
        .cookie(cookie.clone())
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_1",
                "reset_epoch_second": 100
            }]
        })
    );

    let response = test::TestRequest::post()
        .uri("/internal-api/progress_reset/add")
        .cookie(cookie.clone())
        .set_json(json!({"problem_id":"problem_1","reset_epoch_second":200}))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/progress_reset/list")
        .cookie(cookie.clone())
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_1",
                "reset_epoch_second": 200
            }]
        })
    );

    let response = test::TestRequest::post()
        .uri("/internal-api/progress_reset/add")
        .cookie(cookie.clone())
        .set_json(json!({"problem_id":"problem_2","reset_epoch_second":200}))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let response = test::TestRequest::post()
        .uri("/internal-api/progress_reset/delete")
        .cookie(cookie.clone())
        .set_json(json!({"problem_id":"problem_1"}))
        .send_request(&app)
        .await;

    assert!(response.status().is_success());

    let request = test::TestRequest::get()
        .uri("/internal-api/progress_reset/list")
        .cookie(cookie)
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "items": [{
                "problem_id": "problem_2",
                "reset_epoch_second": 200
            }]
        })
    );
}
