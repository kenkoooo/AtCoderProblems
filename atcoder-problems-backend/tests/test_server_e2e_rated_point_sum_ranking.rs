use async_std::future::ready;
use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::{run_server, Authentication, GitHubUserResponse};
use rand::Rng;
use serde_json::{json, Value};
use sql_client::PgPool;
use tide::Result;
mod utils;
#[derive(Clone)]
struct MockAuth;
#[async_trait]
impl Authentication for MockAuth {
    async fn get_token(&self, _: &str) -> Result<String> {
        unimplemented!()
    }

    async fn get_user_id(&self, _: &str) -> Result<GitHubUserResponse> {
        unimplemented!()
    }
}

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

#[async_std::test]
async fn test_rated_point_sum_ranking() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;
    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=3",
        port,
    ))
    .recv_json::<Value>()
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

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=1&to=3",
        port,
    ))
    .recv_json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!([
            {"user_id":"u1","point_sum":1},
            {"user_id":"u3","point_sum":1}
        ])
    );

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=1",
        port,
    ))
    .recv_json::<Value>()
    .await
    .unwrap();
    assert_eq!(
        response,
        json!([
            {"user_id":"u2","point_sum":2}
        ])
    );

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=10&to=20",
        port,
    ))
    .recv_json::<Value>()
    .await
    .unwrap();
    assert!(response.as_array().unwrap().is_empty());

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=2000",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=1&to=0",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    let response = surf::get(url(
        "/atcoder-api/v3/rated_point_sum_ranking?from=-1&to=0",
        port,
    ))
    .await
    .unwrap();
    assert_eq!(response.status(), 400);

    server.race(ready(())).await;
}
