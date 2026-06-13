use axum::http::StatusCode;

pub(crate) async fn get_healthcheck() -> StatusCode {
    StatusCode::OK
}
