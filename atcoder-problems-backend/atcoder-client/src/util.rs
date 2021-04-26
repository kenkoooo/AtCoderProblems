use crate::Result;

use serde::de::DeserializeOwned;

pub(crate) async fn get_html(url: &str) -> Result<String> {
    Ok(surf::get(url)
        .set_header("accept", "text/html")
        .set_header("accept-encoding", "gzip")
        .recv_string()
        .await?)
}

pub(crate) async fn get_json<T: DeserializeOwned>(url: &str) -> Result<T> {
    Ok(surf::get(url)
        .set_header("accept", "application/json")
        .set_header("accept-encoding", "gzip")
        .recv_json()
        .await?)
}

pub trait Problem {
    fn url(&self) -> String;
}
