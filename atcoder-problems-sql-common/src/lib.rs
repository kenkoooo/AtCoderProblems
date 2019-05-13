#[macro_use]
extern crate diesel;

pub mod models;
pub mod schema;
pub mod sql;

pub const FIRST_AGC_EPOCH_SECOND: i64 = 1468670400;
pub const UNRATED_STATE: &str = "-";
