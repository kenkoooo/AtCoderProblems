use std::{net::SocketAddr, sync::Arc};

use atcoder_problems_backend::server::{AppState, GithubClient, make_router};
use sea_orm::Database;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let database_url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL must be set")?;
    let client_id = std::env::var("CLIENT_ID").map_err(|_| "CLIENT_ID must be set")?;
    let client_secret = std::env::var("CLIENT_SECRET").map_err(|_| "CLIENT_SECRET must be set")?;
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);

    let db = Database::connect(&database_url).await?;
    let github = GithubClient::new(
        &client_id,
        &client_secret,
        "https://github.com",
        "https://api.github.com",
    )?;
    let state = AppState::new(db, Arc::new(github));
    let app = make_router(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
