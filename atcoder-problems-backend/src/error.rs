use diesel::{ConnectionResult, QueryResult};
use lambda_runtime::error::HandlerError;

pub trait MapHandlerError<T> {
    fn herr(self) -> Result<T, HandlerError>;
}

impl<T> MapHandlerError<T> for ConnectionResult<T> {
    fn herr(self) -> Result<T, HandlerError> {
        self.map_err(|e| HandlerError::from(e.to_string().as_str()))
    }
}

impl<T> MapHandlerError<T> for QueryResult<T> {
    fn herr(self) -> Result<T, HandlerError> {
        self.map_err(|e| HandlerError::from(e.to_string().as_str()))
    }
}
