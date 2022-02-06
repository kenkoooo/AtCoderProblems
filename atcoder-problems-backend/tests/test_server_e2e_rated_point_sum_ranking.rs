use rand::Rng;
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

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> u16 {
    prepare_data_set(&utils::initialize_and_connect_to_test_sql().await).await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 3000 + 3000
}

#[actix_web::test]
async fn test_rated_point_sum_ranking() {
    let port = setup().await;
    let server = actix_web::rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        actix_web::HttpServer::new(move || {
            actix_web::App::new()
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
    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=3",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!([
            {"user_id":"u2","point_sum":2},
            {"user_id":"u1","point_sum":1},
            {"user_id":"u3","point_sum":1}
        ])
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=1&to=3",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!([
            {"user_id":"u1","point_sum":1},
            {"user_id":"u3","point_sum":1}
        ])
    );
    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=1",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!([
            {"user_id":"u2","point_sum":2}
        ])
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=10&to=20",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=2000",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=1&to=0",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = reqwest::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=-1&to=0",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    server.abort();
    server.await.unwrap_err();
}

#[actix_web::test]
async fn test_users_rated_point_sum_ranking() {
    let port = setup().await;
    let server = actix_web::rt::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        actix_web::HttpServer::new(move || {
            actix_web::App::new()
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

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=u2",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":2,
            "rank":0
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=u1",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=u3",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=U2",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":2,
            "rank":0
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=U1",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=U3",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();

    assert_eq!(
        response,
        json!({
            "count":1,
            "rank":1
        })
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/rated_point_sum_rank?user=not_exist",
        port,
    ))
    .await
    .unwrap();

    assert_eq!(response.status(), 404);

    server.abort();
    server.await.unwrap_err();
}
