extern crate reqwest;
extern crate select;
extern crate regex;
extern crate serde_json;
extern crate serde;
extern crate chrono;
extern crate toml;
extern crate mysql;

#[macro_use]
extern crate serde_derive;

pub mod scraper;
pub mod conf;
pub mod db;