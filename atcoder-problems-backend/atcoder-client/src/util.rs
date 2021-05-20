use anyhow::{anyhow, Result};

use serde::de::DeserializeOwned;

pub(crate) async fn get_html(url: &str) -> Result<(String, surf::StatusCode)> {
    let mut response = surf::get(url)
        .header("accept", "text/html")
        .header("accept-encoding", "gzip")
        .send()
        .await
        .map_err(|e| anyhow!("Connection error: {:?}", e))?;
    let status = response.status();
    if !status.is_success() {
        log::error!("{:?}", response);
    }
    let body = response
        .body_string()
        .await
        .map_err(|e| anyhow!("Failed to parse HTTP body: {:?}", e))?;
    Ok((body, status))
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
