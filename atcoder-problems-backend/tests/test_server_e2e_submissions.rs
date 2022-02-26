use actix_web::{http::StatusCode, test, App};
use atcoder_problems_backend::server::config_services;
use serde_json::Value;
use sql_client::models::Submission;
use sql_client::PgPool;

pub mod utils;

async fn prepare_data_set(conn: &PgPool) {
    sql_client::query(r"INSERT INTO accepted_count (user_id, problem_count) VALUES ('u1', 1)")
        .execute(conn)
        .await
        .unwrap();
    sql_client::query(r"INSERT INTO rated_point_sum (user_id, point_sum) VALUES ('u1', 1.0)")
        .execute(conn)
        .await
        .unwrap();
    sql_client::query(
        r"
    INSERT INTO
        submissions (epoch_second, problem_id, contest_id, user_id, result, id, language, point, length)
        VALUES
            (0,  'p1',   'c1',   'u1',   'WA',   1,  'Rust',    0.0,    0),
            (1,  'p1',   'c1',   'u1',   'RE',   2,  'Rust',    0.0,    0),
            (2,  'p1',   'c1',   'u1',   'AC',   3,  'Rust',    0.0,    0),
            (3,  'p1',   'c1',   'u1',   'AC',   4,  'Rust',    0.0,    0),
            (100,'p1',   'c1',   'u1',   'AC',   5,  'Rust',    0.0,    0),
            (4,  'p1',   'c1',   'u2',   'WA',   6,  'Rust',    0.0,    0),
            (5,  'p1',   'c1',   'u2',   'RE',   7,  'Rust',    0.0,    0),
            (6,  'p1',   'c1',   'u2',   'AC',   8,  'Rust',    0.0,    0),
            (7,  'p1',   'c1',   'u2',   'AC',   9,  'Rust',    0.0,    0),
            (200,'p1',   'c1',   'u2',   'AC',   10, 'Rust',    0.0,    0)",
    )
    .execute(conn)
    .await
    .unwrap();
}

#[actix_web::test]
async fn test_user_submissions() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/results?user=u1")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

    let response = test::TestRequest::get()
        .uri("/atcoder-api/results?user=u2")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, response).await;

    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));
}

#[actix_web::test]
async fn test_user_submissions_fromtime() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submissions?user=u1&from_second=3")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submissions?user=u2&from_second=6")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 3);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));
    assert_eq!(submissions[0].epoch_second, 6);
    assert_eq!(submissions[1].epoch_second, 7);
    assert_eq!(submissions[2].epoch_second, 200);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submissions?user=u3&from_second=0")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert!(submissions.is_empty());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submissions?user=u1&from_second=-30")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 5);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submissions?user=u2&from_second=3000")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert!(submissions.is_empty());
}

#[actix_web::test]
async fn test_time_submissions() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/from/100")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.epoch_second >= 100));
}

#[actix_web::test]
async fn test_submission_count() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submission_count?user=u1&from_second=1&to_second=4")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response["count"], serde_json::json!(3));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/submission_count?user=u1&from_second=1&to_second=3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response["count"], serde_json::json!(2));
}

#[actix_web::test]
async fn test_invalid_path() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/from/")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/results")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get().uri("/").to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[actix_web::test]
async fn test_health_check() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get().uri("/healthcheck").to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::OK);
}

#[actix_web::test]
async fn test_cors() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/from/100")
        .to_request();

    assert_eq!(
        test::call_service(&app, request)
            .await
            .headers()
            .get("access-control-allow-origin")
            .unwrap(),
        "*"
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v2/user_info?user=u1")
        .to_request();

    assert_eq!(
        test::call_service(&app, request)
            .await
            .headers()
            .get("access-control-allow-origin")
            .unwrap(),
        "*"
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/results?user=u1")
        .to_request();

    assert_eq!(
        test::call_service(&app, request)
            .await
            .headers()
            .get("access-control-allow-origin")
            .unwrap(),
        "*"
    );
}

#[actix_web::test]
async fn test_users_and_time() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/users_and_time?users=u1,u2&problems=p1&from=100&to=200")
        .to_request();
    let submissions: Vec<Submission> = test::call_and_read_body_json(&app, request).await;

    assert_eq!(submissions.len(), 2);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u1").count(), 1);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u2").count(), 1);
}
