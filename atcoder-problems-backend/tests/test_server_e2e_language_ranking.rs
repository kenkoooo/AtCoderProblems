use actix_web::{test, web, App};
use atcoder_problems_backend::server::config_services;
use serde_json::{json, Value};
use sql_client::PgPool;

pub mod utils;

async fn prepare_data_set(conn: &PgPool) {
    sql_client::query(
        r"INSERT INTO language_count (user_id, simplified_language, problem_count)
         VALUES
         ('user1', 'lang1', 1),
         ('user1', 'lang2', 1),
         ('user1', 'lang3', 3),
         ('user2', 'lang1', 3),
         ('user2', 'lang2', 2),
         ('user3', 'lang1', 2),
         ('user3', 'lang2', 2)",
    )
    .execute(conn)
    .await
    .unwrap();
}

#[actix_web::test]
async fn test_language_ranking() {
    let conn = utils::initialize_and_connect_to_test_sql().await;
    prepare_data_set(&conn).await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(conn))
            .configure(config_services),
    )
    .await;

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=1&to=3&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {"user_id": "user3", "count": 2},
            {"user_id": "user1", "count": 1},
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=0&to=1&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {"user_id": "user2", "count": 2}
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=10&to=20&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert!(response.as_array().unwrap().is_empty());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=0&to=1&language=does_not_exist")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert!(response.as_array().unwrap().is_empty());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=0&to=2000&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), 400);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=1&to=0&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert!(response.as_array().unwrap().is_empty());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_ranking?from=-1&to=0&language=lang2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), 400);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/language_rank?user=user1")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {
                "language": "lang1",
                "count": 1,
                "rank": 3,
            },
            {
                "language": "lang2",
                "count": 1,
                "rank": 3,
            },
            {
                "language": "lang3",
                "count": 3,
                "rank": 1,
            },
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/language_rank?user=user2")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {
                "language": "lang1",
                "count": 3,
                "rank": 1,
            },
            {
                "language": "lang2",
                "count": 2,
                "rank": 1,
            },
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/language_rank?user=user3")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(
        response,
        json!([
            {
                "language": "lang1",
                "count": 2,
                "rank": 2,
            },
            {
                "language": "lang2",
                "count": 2,
                "rank": 1,
            },
        ])
    );

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/language_rank?user=does_not_exist")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!([]));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/user/language_rank?bad=request")
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), 400);
}
