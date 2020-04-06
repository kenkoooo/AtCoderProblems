use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::server::{initialize_pool, run_server, Authentication};
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::*;

use async_std::future::ready;
use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::GitHubUserResponse;
use diesel::{insert_into, ExpressionMethods, PgConnection, RunQueryDsl};
use rand::Rng;

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

fn prepare_data_set(conn: &PgConnection) {
    insert_into(submission_count::table)
        .values(vec![
            (
                submission_count::user_id.eq("u1"),
                submission_count::count.eq(5),
            ),
            (
                submission_count::user_id.eq("u2"),
                submission_count::count.eq(5),
            ),
        ])
        .execute(conn)
        .unwrap();
    insert_into(accepted_count::table)
        .values(vec![(
            accepted_count::user_id.eq("u1"),
            accepted_count::problem_count.eq(1),
        )])
        .execute(conn)
        .unwrap();
    insert_into(rated_point_sum::table)
        .values(vec![(
            rated_point_sum::user_id.eq("u1"),
            rated_point_sum::point_sum.eq(1.0),
        )])
        .execute(conn)
        .unwrap();
    let submissions = vec![
        // for user=u1
        (0, "p1", "c1", "u1", "WA"),
        (1, "p1", "c1", "u1", "RE"),
        (2, "p1", "c1", "u1", "AC"),
        (3, "p1", "c1", "u1", "AC"),
        (100, "p1", "c1", "u1", "AC"),
        // for user=u2
        (4, "p1", "c1", "u2", "WA"),
        (5, "p1", "c1", "u2", "RE"),
        (6, "p1", "c1", "u2", "AC"),
        (7, "p1", "c1", "u2", "AC"),
        (200, "p1", "c1", "u2", "AC"),
    ]
    .into_iter()
    .map(
        |(epoch_second, problem_id, contest_id, user_id, result)| Submission {
            id: epoch_second,
            epoch_second,
            problem_id: problem_id.to_string(),
            contest_id: contest_id.to_string(),
            user_id: user_id.to_string(),
            result: result.to_string(),
            ..Default::default()
        },
    )
    .collect::<Vec<_>>();
    insert_into(submissions::table)
        .values(submissions)
        .execute(conn)
        .unwrap();
}

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

fn setup() -> u16 {
    prepare_data_set(&utils::initialize_and_connect_to_test_sql());
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

#[async_std::test]
async fn test_user_submissions() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let submissions: Vec<Submission> = surf::get(url("/atcoder-api/results?user=u1", port))
        .await?
        .body_json()
        .await?;
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

    let mut response = surf::get(url("/atcoder-api/results?user=u2", port)).await?;
    let submissions: Vec<Submission> = response.body_json().await?;
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_etag() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let mut response = surf::get(url("/atcoder-api/results?user=u2", port)).await?;
    let etag = response.header("Etag").unwrap().to_string();
    let submissions: Vec<Submission> = response.body_json().await?;
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

    let response = surf::get(url("/atcoder-api/results?user=u2", port))
        .set_header("If-None-Match", etag)
        .await?;
    assert_eq!(response.status(), 304);

    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_time_submissions() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let submissions: Vec<Submission> = surf::get(url("/atcoder-api/v3/from/100", port))
        .await?
        .body_json()
        .await?;
    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.epoch_second >= 100));

    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_invalid_path() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/atcoder-api/v3/from/", port)).await?;
    assert_eq!(response.status(), 404);

    let response = surf::get(url("/atcoder-api/results", port)).await?;
    assert_eq!(response.status(), 400);

    let response = surf::get(url("/", port)).await?;
    assert_eq!(response.status(), 404);

    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_health_check() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/healthcheck", port)).await?;
    assert_eq!(response.status(), 200);
    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_cors() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    assert_eq!(
        surf::get(url("/atcoder-api/v3/from/100", port))
            .await?
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    assert_eq!(
        surf::get(url("/atcoder-api/v2/user_info?user=u1", port))
            .await?
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    assert_eq!(
        surf::get(url("/atcoder-api/results?user=u1", port))
            .await?
            .header("access-control-allow-origin")
            .unwrap(),
        "*"
    );
    server.race(ready(())).await;
    Ok(())
}

#[async_std::test]
async fn test_users_and_time() -> Result<()> {
    let port = setup();
    let server = task::spawn(async move {
        let pool = initialize_pool(utils::SQL_URL).unwrap();
        run_server(pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;
    let submissions: Vec<Submission> = surf::get(url(
        "/atcoder-api/v3/users_and_time?users=u1,u2&problems=p1&from=100&to=200",
        port,
    ))
    .await?
    .body_json()
    .await?;
    assert_eq!(submissions.len(), 2);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u1").count(), 1);
    assert_eq!(submissions.iter().filter(|s| &s.user_id == "u2").count(), 1);

    server.race(ready(())).await;
    Ok(())
}
