use std::env;

use atcoder_problems_backend::server::middleware::github_auth::GithubClient;
use atcoder_problems_backend::server::run_server;
use atcoder_problems_backend::utils::init_log_config;

#[actix_web::main]
async fn main() {
    init_log_config().unwrap();
    let database_url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let port = 8080;

    let client_id = env::var("CLIENT_ID").unwrap_or_else(|_| String::new());
    let client_secret = env::var("CLIENT_SECRET").unwrap_or_else(|_| String::new());

    let pg_pool = sql_client::initialize_pool(&database_url)
        .await
        .expect("Failed to initialize the connection pool");
    let github = GithubClient::new(&client_id, &client_secret, "https://api.github.com")
        .expect("Failed to create github client");
    run_server(pg_pool, github, port)
        .await
        .expect("Failed to run server");
}
