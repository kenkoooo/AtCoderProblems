mod client;
mod error;
mod parser;
mod types;

pub use client::{CrawlerClient, ProblemFetcher};
pub use error::CrawlerError;
pub use parser::{parse_submissions_html, parse_tasks_html};
pub use types::{Problem, Submission};
