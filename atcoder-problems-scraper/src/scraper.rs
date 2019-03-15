pub const ATCODER_HOST: &str = "https://atcoder.jp";

pub mod contest;
pub mod problem;

pub use self::contest::scrape_all_contests;
pub use self::problem::scrape_problems;
