use actix_web::http::StatusCode;
use actix_web::{test, web, App};
use atcoder_problems_backend::server::config_services;
use serde_json::{json, Value};

pub mod utils;

#[actix_web::test]
async fn test_ac_ranking() {
    let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
        .await
        .unwrap();
    sql_client::query("TRUNCATE accepted_count")
        .execute(&pg_pool)
        .await
        .unwrap();
    sql_client::query(
        r"INSERT INTO accepted_count (user_id, problem_count) VALUES ('u1', 1), ('u2', 2), ('u3', 1)",
    )
    .execute(&pg_pool)
    .await
    .unwrap();

    let mut app = test::init_service(
        App::new()
            .app_data(web::Data::new(pg_pool.clone()))
            .configure(config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/ac_ranking?from=0&to=10")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {"user_id": "u2", "count": 2},
            {"user_id": "u1", "count": 1},
            {"user_id": "u3", "count": 1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/ac_ranking?from=1&to=3")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {"user_id": "u1", "count": 1},
            {"user_id": "u3", "count": 1}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/ac_ranking?from=10&to=0")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response.as_array().unwrap().len(), 0);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/ac_ranking?from=0&to=2000")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/ac_ranking?from=-1&to=10")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=u1")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 1, "rank": 1}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=u2")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 2, "rank": 0}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=u3")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 1, "rank": 1}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=U1")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 1, "rank": 1}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=U2")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 2, "rank": 0}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=U3")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!({"count": 1, "rank": 1}));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/ac_rank?user=does_not_exist")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
