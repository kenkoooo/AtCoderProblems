pub trait ApiResult<T> {
    fn map_internal_server_err(self) -> actix_web::Result<T>;
}

impl<T, E> ApiResult<T> for std::result::Result<T, E>
where
    E: std::fmt::Debug + std::fmt::Display + 'static,
{
    fn map_internal_server_err(self) -> actix_web::Result<T> {
        self.map_err(actix_web::error::ErrorInternalServerError)
    }
}
