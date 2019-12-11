use std::env;

use atcoder_problems_backend::server::run_server;
use futures::executor::block_on;

fn main() {
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let port = 8080;
    block_on(run_server(&url, port)).expect("Failed to run server");
}
