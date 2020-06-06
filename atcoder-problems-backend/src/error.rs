use serde::export::Formatter;

/// Since http_types::Error is a wrapper of anyhow::Error, but it can not be constructed from anyhow::Error,
/// let's us http_types::Error as anyhow::Error.
pub type Result<T> = std::result::Result<T, http_types::Error>;

#[derive(Debug)]
pub(crate) enum ErrorTypes {
    InvalidRequest,
    CookieNotFound,
}

impl std::error::Error for ErrorTypes {}

impl std::fmt::Display for ErrorTypes {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}
