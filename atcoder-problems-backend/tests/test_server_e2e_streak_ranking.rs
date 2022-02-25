use actix_web::{http::StatusCode, test, App};
use atcoder_problems_backend::server::config_services;
use serde_json::{json, Value};
use sql_client::PgPool;

pub mod utils;

async fn prepare_data_set(conn: &PgPool) {
    sql_client::query(
        r"INSERT INTO max_streaks (user_id, streak) VALUES ('u1', 1), ('u2', 2), ('u3', 1)",
    )
    .execute(conn)
    .await
    .unwrap();
}

#[actix_web::test]
async fn test_streak_ranking() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool.clone()))
            .configure(config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/streak_ranking?from=0&to=10")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!([
            {"user_id": "u2", "count": 2},
            {"user_id": "u1", "count": 1},
            {"user_id": "u3", "count": 1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/streak_ranking?from=1&to=3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!([
            {"user_id": "u1", "count": 1},
            {"user_id": "u3", "count": 1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/streak_ranking?from=10&to=0")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert!(response.as_array().unwrap().is_empty());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/streak_ranking?from=0&to=2000")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/streak_ranking?from=-1&to=10")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/streak_rank?user=u1")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response, json!({"count":1,"rank":1}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/streak_rank?user=u2")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(response, json!({"count":2,"rank":0}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/streak_rank?user=does_not_exist")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/streak_rank?bad=request")
        .to_request();
    let response = test::call_service(&app, request).await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
