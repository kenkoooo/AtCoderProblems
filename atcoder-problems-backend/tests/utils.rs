use atcoder_problems_backend::server::middleware::github_auth::GithubToken;
use httpmock::MockServer;
use serde_json::json;
use sql_client::{initialize_pool, PgPool};
use std::fs::read_to_string;

const SQL_FILE: &str = "../config/database-definition.sql";
const SQL_URL_ENV_KEY: &str = "SQL_URL";

pub fn get_sql_url_from_env() -> String {
    std::env::var(SQL_URL_ENV_KEY).unwrap()
}

pub async fn initialize_and_connect_to_test_sql() -> PgPool {
    let conn = initialize_pool(get_sql_url_from_env()).await.unwrap();

    for query_str in read_to_string(SQL_FILE).unwrap().split(";") {
        sql_client::query(query_str).execute(&conn).await.unwrap();
    }
    conn
}

pub fn start_mock_github_server(access_token: &str) -> MockServer {
    let server = MockServer::start();
    let token = access_token.to_string();
    server.mock(|when, then| {
        when.method("POST").path("/login/oauth/access_token");
        then.status(200).json_body(json!({
            "access_token": token.clone()
        }));
    });
    server
}

pub fn start_mock_github_api_server(access_token: &str, token: GithubToken) -> MockServer {
    let server = MockServer::start();
    let token_header = format!("token {}", access_token);
    server.mock(|when, then| {
        when.method("GET")
            .path("/user")
            .header("Authorization", &token_header);
        then.status(200).json_body_obj(&token);
    });
    server
}
