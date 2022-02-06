use atcoder_problems_backend::server::middleware::github_auth::{
    GithubAuthentication, GithubClient, GithubToken,
};
use rand::Rng;
use serde_json::{json, Value};
use std::time::Duration;

pub mod utils;

async fn setup() -> u16 {
    utils::initialize_and_connect_to_test_sql().await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

#[actix_web::test]
async fn test_progress_reset() {
    let token = "access_token";
    let port = setup().await;
    let mock_server = utils::start_mock_github_server(token, GithubToken { id: 0 });
    let mock_server_base_url = mock_server.base_url();
    let server = actix_web::rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        let github = GithubClient::new("", "", &mock_server_base_url).unwrap();
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
    actix_web::rt::time::sleep(Duration::from_millis(1000)).await;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let response = client
        .get(url("/internal-api/authorize?code=a", port))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 302);

    let response = reqwest::Client::new()
        .get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(
        response,
        json!({
        "items":[]
        })
    );

    let response = reqwest::Client::new()
        .post(url("/internal-api/progress_reset/add", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({"problem_id":"problem_1","reset_epoch_second":100}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = reqwest::Client::new()
        .get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/progress_reset/add", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({"problem_id":"problem_1","reset_epoch_second":200}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = reqwest::Client::new()
        .get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    let response = reqwest::Client::new()
        .post(url("/internal-api/progress_reset/add", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({"problem_id":"problem_2","reset_epoch_second":200}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = reqwest::Client::new()
        .post(url("/internal-api/progress_reset/delete", port))
        .header("Cookie", format!("token={}", token))
        .json(&json!({"problem_id":"problem_1"}))
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    let response = reqwest::Client::new()
        .get(url("/internal-api/progress_reset/list", port))
        .header("Cookie", format!("token={}", token))
        .send()
        .await
        .unwrap()
        .json::<Value>()
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

    server.abort();
    server.await.unwrap_err();
}
