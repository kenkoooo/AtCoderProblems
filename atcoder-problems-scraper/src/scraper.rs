pub(crate) const ATCODER_HOST: &str = "https://atcoder.jp";

pub mod contest;
pub mod problem;
pub mod submission;

pub use self::contest::scrape_all_contests;
pub use self::problem::scrape_problems;

use reqwest::{header, Client};

pub(crate) fn get_html(url: &str) -> Result<String, String> {
    Client::new()
        .get(url)
        .header(header::ACCEPT, "text/html")
        .send()
        .map_err(|e| format!("{:?}", e))
        .and_then(|mut response| response.text().map_err(|e| format!("{:?}", e)))
}
