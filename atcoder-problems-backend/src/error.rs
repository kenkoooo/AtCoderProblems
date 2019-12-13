use serde::export::Formatter;

#[derive(Debug)]
pub enum Error {
    ConnectionError(diesel::ConnectionError),
    QueryError(diesel::result::Error),
    IOError(std::io::Error),
    ConnectionPoolError(r2d2::Error),
    TideError(tide::Error),
    JSONError(serde_json::Error),
    HttpConnectionError(surf::Exception),
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

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Error::IOError(e)
    }
}
impl From<r2d2::Error> for Error {
    fn from(e: r2d2::Error) -> Self {
        Error::ConnectionPoolError(e)
    }
}

impl From<tide::Error> for Error {
    fn from(e: tide::Error) -> Self {
        Error::TideError(e)
    }
}

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self {
        Error::JSONError(e)
    }
}

impl From<surf::Exception> for Error {
    fn from(e: surf::Exception) -> Self {
        Error::HttpConnectionError(e)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

impl std::error::Error for Error {}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "({:?})", self)
    }
}
