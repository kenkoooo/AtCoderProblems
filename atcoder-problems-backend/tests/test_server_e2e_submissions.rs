use atcoder_problems_backend::error::Result;
use atcoder_problems_backend::server::Authentication;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::*;

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
    prepare_data_set(&utils::connect_to_test_sql());
    let mut rng = rand::thread_rng();
    rng.gen::<u16>() % 30000 + 30000
}

async fn test_user_submissions(port: u16) {
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
}

async fn test_etag(port: u16) {
    let mut response = surf::get(url("/atcoder-api/results?user=u2", port))
        .await
        .unwrap();
    let etag = response.header("Etag").unwrap().to_string();
    let submissions: Vec<Submission> = response.body_json().await.unwrap();
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

    let response = surf::get(url("/atcoder-api/results?user=u2", port))
        .set_header("If-None-Match", etag)
        .await
        .unwrap();
    assert_eq!(response.status(), 304);
}

async fn test_time_submissions(port: u16) {
    let submissions: Vec<Submission> = surf::get(url("/atcoder-api/v3/from/100", port))
        .await
        .unwrap()
        .body_json()
        .await
        .unwrap();
    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.epoch_second >= 100));
}

async fn test_invalid_path(port: u16) {
    let response = surf::get(url("/atcoder-api/v3/from/", port)).await.unwrap();
    assert_eq!(response.status(), 404);

    let response = surf::get(url("/atcoder-api/results", port)).await.unwrap();
    assert_eq!(response.status(), 400);

    let response = surf::get(url("/", port)).await.unwrap();
    assert_eq!(response.status(), 404);
}

async fn test_health_check(port: u16) {
    let response = surf::get(url("/healthcheck", port)).await.unwrap();
    assert_eq!(response.status(), 200);
}

async fn test_cors(port: u16) {
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
}

async fn test_users_and_time(port: u16) {
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
}

#[test]
fn test_server_e2e_submissions() {
    task::block_on(async {
        let port = setup();
        let server = utils::start_server_handle(MockAuth, port);
        let client = utils::run_client_handle(async move {
            test_user_submissions(port).await;
            test_etag(port).await;
            test_time_submissions(port).await;
            test_invalid_path(port).await;
            test_health_check(port).await;
            test_cors(port).await;
            test_users_and_time(port).await;
            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
