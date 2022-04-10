use actix_web::{test, App};
use reqwest::StatusCode;
use serde_json::{json, Value};
use sql_client::PgPool;

mod utils;

async fn prepare_data_set(conn: &PgPool) {
    sql_client::query(
        r"INSERT INTO rated_point_sum (user_id, point_sum) VALUES ('u1', 1), ('u2', 2), ('u3', 1)",
    )
    .execute(conn)
    .await
    .unwrap();
}

#[actix_web::test]
async fn test_rated_point_sum_ranking() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=0&to=3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!([
            {"user_id":"u2","point_sum":2,"count":2},
            {"user_id":"u1","point_sum":1,"count":1},
            {"user_id":"u3","point_sum":1,"count":1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=1&to=3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!([
            {"user_id":"u1","point_sum":1,"count":1},
            {"user_id":"u3","point_sum":1,"count":1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=0&to=1")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!([
            {"user_id":"u2","point_sum":2,"count":2}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=10&to=20")
        .to_request();
    let response: Vec<Value> = test::call_and_read_body_json(&app, request).await;

    assert!(response.is_empty());

    let response = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=0&to=2000")
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=1&to=0")
        .to_request();
    let response: Vec<Value> = test::call_and_read_body_json(&app, request).await;

    assert!(response.is_empty());

    let response = test::TestRequest::get()
        .uri("/atcoder-api/v3/rated_point_sum_ranking?from=-1&to=0")
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[actix_web::test]
async fn test_users_rated_point_sum_ranking() {
    let pg_pool = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&pg_pool).await;

    let app = test::init_service(
        actix_web::App::new()
            .app_data(actix_web::web::Data::new(pg_pool))
            .configure(atcoder_problems_backend::server::config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=u2")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":2,
            "rank":0
        })
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=u1")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=u3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=U2")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":2,
            "rank":0
        })
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=U1")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=U3")
        .to_request();
    let response: Value = test::call_and_read_body_json(&app, request).await;

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let response = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/rated_point_sum_rank?user=not_exist")
        .send_request(&app)
        .await;

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
