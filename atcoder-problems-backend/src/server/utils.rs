use md5::{Digest, Md5};
pub(crate) fn calc_etag_for_user(user_id: &str, count: usize) -> String {
    let mut hasher = Md5::new();
    hasher.input(user_id.as_bytes());
    hasher.input(b" ");
    hasher.input(count.to_be_bytes());
    hex::encode(hasher.result())
}

pub(crate) fn calc_etag_for_time(from_epoch_second: i64, max_id: i64) -> String {
    let mut hasher = Md5::new();
    hasher.input(from_epoch_second.to_be_bytes());
    hasher.input(b" ");
    hasher.input(max_id.to_be_bytes());
    hex::encode(hasher.result())
}
