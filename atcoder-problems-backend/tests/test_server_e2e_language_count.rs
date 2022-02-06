use actix_web::{test, web, App};
use atcoder_problems_backend::server::config_services;
use serde_json::{json, Value};
use sql_client::PgPool;

pub mod utils;

async fn insert_data_set1(conn: &PgPool) {
    sql_client::query(
        r"INSERT INTO language_count (user_id, simplified_language, problem_count)
         VALUES
         ('user1', 'lang1', 1),
         ('user1', 'lang2', 300),
         ('user2', 'lang1', 3),
         ('user3', 'lang3', 2)",
    )
    .execute(conn)
    .await
    .unwrap();
}

async fn insert_data_set2(conn: &PgPool) {
    sql_client::query(
        r"INSERT INTO language_count (user_id, simplified_language, problem_count)
         VALUES
         ('user1', 'lang4', 1),
         ('user4', 'lang1', 2)",
    )
    .execute(conn)
    .await
    .unwrap();
}

#[actix_web::test]
async fn test_language_count() {
    let conn = utils::initialize_and_connect_to_test_sql().await;
    let mut app = test::init_service(
        App::new()
            .app_data(web::Data::new(conn.clone()))
            .configure(config_services),
    )
    .await;

    insert_data_set1(&conn).await;
    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_list")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!(["lang1", "lang2", "lang3"]));

    insert_data_set2(&conn).await;
    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/language_list")
        .to_request();
    let response = test::call_service(&mut app, request).await;
    assert_eq!(response.status(), actix_web::http::StatusCode::OK);
    let response: Value = test::read_body_json(response).await;
    assert_eq!(response, json!(["lang1", "lang2", "lang3", "lang4"]));
}
