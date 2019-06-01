use diesel::{ConnectionResult, QueryResult};
use lambda_runtime::error::HandlerError;

pub trait MapHandlerError<T> {
    fn map_handler_error(self) -> Result<T, HandlerError>;
}

impl<T> MapHandlerError<T> for ConnectionResult<T> {
    fn map_handler_error(self) -> Result<T, HandlerError> {
        self.map_err(|e| HandlerError::from(e.to_string().as_str()))
    }
}

impl<T> MapHandlerError<T> for QueryResult<T> {
    fn map_handler_error(self) -> Result<T, HandlerError> {
        self.map_err(|e| HandlerError::from(e.to_string().as_str()))
    }
}
