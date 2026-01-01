mod client;
mod error;
mod parser;
mod types;

pub use client::{ContestFetcher, CrawlerClient, ProblemFetcher};
pub use error::CrawlerError;
pub use parser::{
    parse_contests_archive_html, parse_permanent_contests_html, parse_submissions_html,
    parse_tasks_html,
};
pub use types::{Contest, Problem, Submission};
