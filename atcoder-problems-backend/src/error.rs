use serde::export::Formatter;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    ConnectionError(diesel::ConnectionError),
    QueryError(diesel::result::Error),
    IOError(std::io::Error),
    ConnectionPoolError(r2d2::Error),
    JSONError(serde_json::Error),
    CookieNotFound,
    InvalidGetRequest,
    InvalidPostRequest,
    OtherError,
    S3Error(s3::error::S3Error),
    AtCoderClientError(algorithm_problem_client::Error),
    HttpError(http_types::Error),
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

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self {
        Error::JSONError(e)
    }
}

impl From<()> for Error {
    fn from(_: ()) -> Self {
        Error::OtherError
    }
}

impl From<s3::error::S3Error> for Error {
    fn from(e: s3::error::S3Error) -> Self {
        Error::S3Error(e)
    }
}

impl From<algorithm_problem_client::Error> for Error {
    fn from(e: algorithm_problem_client::Error) -> Self {
        Error::AtCoderClientError(e)
    }
}
impl From<http_types::Error> for Error {
    fn from(e: http_types::Error) -> Self {
        Error::HttpError(e)
    }
}

impl std::error::Error for Error {}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "({:?})", self)
    }
}
