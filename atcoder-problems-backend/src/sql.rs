pub mod client;
pub mod delta_update;
mod language_count;
pub mod models;
mod rated_point_sum;
pub mod schema;
pub mod update;

pub const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
pub const UNRATED_STATE: &str = "-";
