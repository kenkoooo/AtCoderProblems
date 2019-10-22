use lambda_runtime::error::HandlerError;
use serde::export::Formatter;

#[derive(Debug)]
pub enum Error {
    ConnectionError(diesel::ConnectionError),
    QueryError(diesel::result::Error),
}

impl From<diesel::ConnectionError> for Error {
    fn from(e: diesel::ConnectionError) -> Self {
        Error::ConnectionError(e)
    }
}

impl From<diesel::result::Error> for Error {
    fn from(e: diesel::result::Error) -> Self {
        Error::QueryError(e)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

impl From<Error> for HandlerError {
    fn from(e: Error) -> Self {
        HandlerError::from(e.to_string().as_str())
    }
}

impl std::error::Error for Error {}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "({:?})", self)
    }
}
