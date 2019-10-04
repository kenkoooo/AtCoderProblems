pub mod models;
pub mod schema;

mod accepted_count;
mod contest_problem;
mod language_count;
mod problem_info;
mod problems_submissions;
mod rated_point_sum;
mod simple_client;
mod streak;
mod submission_client;

const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
const UNRATED_STATE: &str = "-";
const MAX_INSERT_ROWS: usize = 10_000;

pub use accepted_count::AcceptedCountClient;
pub use contest_problem::ContestProblemClient;
pub use language_count::LanguageCountClient;
pub use problem_info::ProblemInfoUpdater;
pub use problems_submissions::ProblemsSubmissionUpdater;
pub use rated_point_sum::RatedPointSumClient;
pub use simple_client::SimpleClient;
pub use streak::StreakUpdater;
pub use submission_client::{SubmissionClient, SubmissionRequest};
