use std::env;

use atcoder_problems_backend::server::run_server;
use atcoder_problems_backend::server::GitHubAuthentication;

#[async_std::main]
async fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    let database_url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let port = 8080;

    let client_id = env::var("CLIENT_ID").unwrap_or_else(|_| String::new());
    let client_secret = env::var("CLIENT_SECRET").unwrap_or_else(|_| String::new());

    let auth = GitHubAuthentication::new(&client_id, &client_secret);
    let pg_pool = sql_client::initialize_pool(&database_url)
        .await
        .expect("Failed to initialize the connection pool");
    run_server(pg_pool, auth, port)
        .await
        .expect("Failed to run server");
}
