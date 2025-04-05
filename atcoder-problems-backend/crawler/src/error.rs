use thiserror::Error;

/// Errors that can occur during parsing
#[derive(Error, Debug)]
pub enum CrawlerError {
    #[error("Failed to create selector: {0}")]
    SelectorError(String),
    #[error("Failed to parse value: {0}")]
    ParseError(String),
}
