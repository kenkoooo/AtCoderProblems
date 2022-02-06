use rand::Rng;
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

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> u16 {
    prepare_data_set(&utils::initialize_and_connect_to_test_sql().await).await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[actix_web::test]
async fn test_language_ranking() {
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
        "/atcoder-api/v3/language_ranking?from=1&to=3&language=lang2",
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
            {"user_id": "user3", "count": 2},
            {"user_id": "user1", "count": 1},
        ])
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=0&to=1&language=lang2",
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
            {"user_id": "user2", "count": 2}
        ])
    );

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=10&to=20&language=lang2",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=0&to=1&language=does_not_exist",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=0&to=2000&language=lang2",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=1&to=0&language=lang2",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = reqwest::get(url(
        "/atcoder-api/v3/language_ranking?from=-1&to=0&language=lang2",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    let response = reqwest::get(url("/atcoder-api/v3/user/language_rank?user=user1", port))
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
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

    let response = reqwest::get(url("/atcoder-api/v3/user/language_rank?user=user2", port))
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
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

    let response = reqwest::get(url("/atcoder-api/v3/user/language_rank?user=user3", port))
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
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

    let response = reqwest::get(url(
        "/atcoder-api/v3/user/language_rank?user=does_not_exist",
        port,
    ))
    .await
    .unwrap()
    .json::<Value>()
    .await
    .unwrap();
    assert_eq!(response, json!([]));

    let response = reqwest::get(url("/atcoder-api/v3/user/language_rank?bad=request", port))
        .await
        .unwrap();
    assert_eq!(response.status(), 400);

    server.abort();
    server.await.unwrap_err();
}
