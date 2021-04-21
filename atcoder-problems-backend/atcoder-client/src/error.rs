#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("connection error")]
    Http(#[from] surf::Exception),
    #[error("failed to parse html")]
    HtmlParseError,
    #[error("failed to parse int")]
    ParseIntError(#[from] std::num::ParseIntError),
    #[error("failed to parse float")]
    ParseFloatError(#[from] std::num::ParseFloatError),
    #[error("failed to parse date")]
    ParseDateError(#[from] chrono::format::ParseError),
}

pub type Result<T> = ::std::result::Result<T, Error>;
