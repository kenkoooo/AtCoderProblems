use async_std::future::ready;
use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::GitHubUserResponse;
use atcoder_problems_backend::server::{run_server, Authentication};
use rand::Rng;
use sql_client::models::Submission;
use sql_client::PgPool;
use tide::Result;

pub mod utils;

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
    sql_client::query(r"INSERT INTO submission_count (user_id, count) VALUES ('u1', 5), ('u2', 5)")
        .execute(conn)
        .await
        .unwrap();
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

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> u16 {
    prepare_data_set(&utils::initialize_and_connect_to_test_sql().await).await;
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[async_std::test]
async fn test_user_submissions() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let submissions: Vec<Submission> = surf::get(url("/atcoder-api/results?user=u1", port))
        .await
        .unwrap()
        .body_json()
        .await
        .unwrap();
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

    let mut response = surf::get(url("/atcoder-api/results?user=u2", port))
        .await
        .unwrap();
    let submissions: Vec<Submission> = response.body_json().await.unwrap();
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_time_submissions() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let submissions: Vec<Submission> = surf::get(url("/atcoder-api/v3/from/100", port))
        .await
        .unwrap()
        .body_json()
        .await
        .unwrap();
    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.epoch_second >= 100));

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_invalid_path() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/atcoder-api/v3/from/", port)).await.unwrap();
    assert_eq!(response.status(), 404);

    let response = surf::get(url("/atcoder-api/results", port)).await.unwrap();
    assert_eq!(response.status(), 400);

    let response = surf::get(url("/", port)).await.unwrap();
    assert_eq!(response.status(), 404);

    server.race(ready(())).await;
}

#[async_std::test]
async fn test_health_check() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/healthcheck", port)).await.unwrap();
    assert_eq!(response.status(), 200);
    server.race(ready(())).await;
}

#[async_std::test]
async fn test_cors() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    assert_eq!(
        surf::get(url("/atcoder-api/v3/from/100", port))
            .await
            .unwrap()
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    assert_eq!(
        surf::get(url("/atcoder-api/v2/user_info?user=u1", port))
            .await
            .unwrap()
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    assert_eq!(
        surf::get(url("/atcoder-api/results?user=u1", port))
            .await
            .unwrap()
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    server.race(ready(())).await;
}

#[async_std::test]
async fn test_users_and_time() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::SQL_URL).await.unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;
    let submissions: Vec<Submission> = surf::get(url(
        "/atcoder-api/v3/users_and_time?users=u1,u2&problems=p1&from=100&to=200",
        port,
    ))
    .await
    .unwrap()
    .body_json()
    .await
    .unwrap();
    assert_eq!(submissions.len(), 2);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u1").count(), 1);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u2").count(), 1);

    server.race(ready(())).await;
}
