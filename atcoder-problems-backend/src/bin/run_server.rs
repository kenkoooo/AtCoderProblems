use atcoder_problems_backend::error::Result;

use std::env;

use atcoder_problems_backend::server::{config_route, AppData};
use futures::executor::block_on;

async fn run_server() -> Result<()> {
    let url = env::var("SQL_URL").expect("SQL_URL is not set.");
    let state = AppData::new(url)?;
    let app = tide::with_state(state);
    let app = config_route(app);
    app.listen("0.0.0.0:8080").await?;
    Ok(())
}

fn main() {
    block_on(run_server()).expect("Failed to run server");
}
