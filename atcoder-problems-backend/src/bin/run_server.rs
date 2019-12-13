use std::env;

use atcoder_problems_backend::server::GitHubAuthentication;
use atcoder_problems_backend::server::{run_server, AppData};
use futures::executor::block_on;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let port = 8080;

    let client_id = env::var("CLIENT_ID").unwrap_or_else(|_| String::new());
    let client_secret = env::var("CLIENT_SECRET").unwrap_or_else(|_| String::new());

    let auth = GitHubAuthentication::new(&client_id, &client_secret);
    let app_data = AppData::new(url, auth).expect("Failed to initialize the connection pool");
    block_on(run_server(app_data, port)).expect("Failed to run server");
}
