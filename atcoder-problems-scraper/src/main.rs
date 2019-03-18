use reqwest::{header, Client};
use scraper::{Html, Selector};
use serde_derive::Serialize;
use serde_json;

use atcoder_problems_scraper::scraper::*;
fn main() {
    println!("{:?}", submission::scrape_submissions("arc102", 1));
}
