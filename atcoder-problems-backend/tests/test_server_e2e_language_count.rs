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

fn url(path: &str, port: u16) -> String {
    format!("http://localhost:{}{}", port, path)
}

async fn setup() -> (u16, PgPool) {
    let conn = utils::initialize_and_connect_to_test_sql().await;
    let mut rng = rand::thread_rng();
    (rng.gen::<u16>() % 30000 + 30000, conn)
}

#[async_std::test]
async fn test_language_count() {
    let (port, conn) = setup().await;
    let server = task::spawn(async move {
        let pg_pool = sql_client::initialize_pool(utils::get_sql_url_from_env())
            .await
            .unwrap();
        run_server(pg_pool, MockAuth, port).await.unwrap();
    });
    task::sleep(std::time::Duration::from_millis(1000)).await;

    insert_data_set1(&conn).await;
    let response = surf::get(url("/atcoder-api/v3/language_list", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!(["lang1", "lang2", "lang3"]));

    insert_data_set2(&conn).await;
    let response = surf::get(url("/atcoder-api/v3/language_list", port))
        .recv_json::<Value>()
        .await
        .unwrap();
    assert_eq!(response, json!(["lang1", "lang2", "lang3", "lang4"]));

    server.race(ready(())).await;
}
