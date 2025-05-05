use thiserror::Error;

/// Errors that can occur during parsing
#[derive(Error, Debug)]
pub enum CrawlerError {
    #[error("Failed to parse HTML: {0}")]
    ParseError(String),

    #[error("Failed to create selector: {0}")]
    SelectorError(String),

    #[error("Failed to make request: {0}")]
    RequestError(#[from] reqwest::Error),

    #[error("HTTP error: {0}")]
    HttpError(String),

    #[error("Invalid header value: {0}")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),

    #[error("Failed to parse JSON: {body}")]
    JsonParseError { body: String },
}
