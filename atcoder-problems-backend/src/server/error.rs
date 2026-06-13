use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(thiserror::Error, Debug)]
pub(crate) enum ServerError {
    #[error("database error: {0}")]
    Db(#[from] sea_orm::DbErr),

    #[error("forbidden")]
    Forbidden,

    #[error("not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("github auth error: {0}")]
    Auth(#[from] crate::server::auth::AuthError),
}

pub(crate) type ServerResult<T> = Result<T, ServerError>;

impl ServerError {
    fn status(&self) -> StatusCode {
        match self {
            ServerError::Auth(_) => StatusCode::UNAUTHORIZED,
            ServerError::Forbidden => StatusCode::FORBIDDEN,
            ServerError::NotFound => StatusCode::NOT_FOUND,
            ServerError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ServerError::Db(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    /// Public message returned to clients. Excludes internal details.
    fn public_message(&self) -> &'static str {
        match self {
            ServerError::Auth(_) => "unauthorized",
            ServerError::Forbidden => "forbidden",
            ServerError::NotFound => "not found",
            ServerError::BadRequest(_) => "bad request",
            ServerError::Db(_) => "internal server error",
        }
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        // Emit details only to structured logs so tokens, URLs, and SQL text never reach the client.
        match &self {
            ServerError::Db(e) => tracing::error!(error = %e, "database error"),
            ServerError::Auth(e) => tracing::warn!(error = %e, "github auth error"),
            ServerError::BadRequest(msg) => tracing::debug!(%msg, "bad request"),
            _ => {}
        }
        let status = self.status();
        // `BadRequest` messages are authored by the server (never derived from
        // untrusted input), so expose them to help the frontend tell causes
        // apart. Everything else gets a fixed public string.
        let error = match &self {
            ServerError::BadRequest(msg) => msg.clone(),
            other => other.public_message().to_string(),
        };
        let body = Json(json!({ "error": error }));
        (status, body).into_response()
    }
}
