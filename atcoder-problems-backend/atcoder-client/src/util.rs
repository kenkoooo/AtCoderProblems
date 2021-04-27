use anyhow::{Result, anyhow};

use serde::de::DeserializeOwned;

pub(crate) async fn get_html(url: &str) -> Result<String> {
    surf::get(url)
        .header("accept", "text/html")
        .header("accept-encoding", "gzip")
        .recv_string()
        .await
        .map_err(|_| anyhow!("Failed to get html from {}", url))
}

pub(crate) async fn get_json<T: DeserializeOwned>(url: &str) -> Result<T> {
    surf::get(url)
        .header("accept", "application/json")
        .header("accept-encoding", "gzip")
        .recv_json()
        .await
        .map_err(|_| anyhow!("Failed to get json from {}", url))
}

pub trait Problem {
    fn url(&self) -> String;
}
