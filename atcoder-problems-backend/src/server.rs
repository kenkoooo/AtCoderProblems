use actix_web::http::header::IF_NONE_MATCH;
use actix_web::{web, HttpRequest, HttpResponse};
use diesel::PgConnection;

pub mod time_submissions;
pub mod user_info;
pub mod user_submissions;
pub mod utils;

pub(crate) type ConnectionManager = diesel::r2d2::ConnectionManager<PgConnection>;
pub(crate) type Pool = diesel::r2d2::Pool<ConnectionManager>;

pub(crate) fn request_with_connection<F>(pool: web::Data<Pool>, f: F) -> HttpResponse
where
    F: FnOnce(&PgConnection) -> HttpResponse,
{
    match pool.get() {
        Ok(conn) => f(&conn),
        _ => HttpResponse::ServiceUnavailable().finish(),
    }
}

pub(crate) trait EtagExtractor {
    fn extract_etag(&self) -> &str;
}

impl EtagExtractor for HttpRequest {
    fn extract_etag(&self) -> &str {
        self.headers()
            .get(IF_NONE_MATCH)
            .and_then(|value| value.to_str().ok())
            .unwrap_or_else(|| "no etag")
    }
}
