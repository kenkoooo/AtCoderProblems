use async_std::future::ready;
use async_std::prelude::*;
use async_std::task;
use async_trait::async_trait;
use atcoder_problems_backend::server::{run_server, Authentication, GitHubUserResponse};
use rand::Rng;
use serde_json::{json, Value};
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

#[async_std::test]
async fn test_language_count_ranking() {
    let port = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    let response = surf::get(url("/atcoder-api/v3/user/language_count_rank?user=user1", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!([
        {
            "language": "lang1",
            "rank": 3,
        },
        {
            "language": "lang2",
            "rank": 3,
        },
        {
            "language": "lang3",
            "rank": 1,
        },
    ]));

    let response = surf::get(url("/atcoder-api/v3/user/language_count_rank?user=user2", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!([
        {
            "language": "lang1",
            "rank": 1,
        },
        {
            "language": "lang2",
            "rank": 1,
        },
    ]));

    let response = surf::get(url("/atcoder-api/v3/user/language_count_rank?user=user3", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!([
        {
            "language": "lang1",
            "rank": 2,
        },
        {
            "language": "lang2",
            "rank": 1,
        },
    ]));

    let response = surf::get(url("/atcoder-api/v3/user/language_count_rank?user=do_not_exist", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!([]));

    let response = surf::get(url("/atcoder-api/v3/user/language_count_rank?bad=request", port))
        .await
        .unwrap();
    assert_eq!(response.status(), 400);

    server.race(ready(())).await;
}
