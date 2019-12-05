use crate::error::Result;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::get_user_submissions;
use actix_web::http::header::IF_NONE_MATCH;
use actix_web::{web, HttpRequest, HttpResponse};
use diesel::PgConnection;

pub mod time_submissions;
pub mod user_info;
pub mod user_submissions;
pub mod utils;

pub(crate) type Pool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>;

pub(crate) fn request_with_connection<F>(pool: &Pool, f: F) -> HttpResponse
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

pub fn config(cfg: &mut web::ServiceConfig, data: AppData) {
    cfg.data(data)
        .service(web::resource("/atcoder-api/results").route(web::get().to(get_user_submissions)))
        .service(web::resource("/atcoder-api/v2/user_info").route(web::get().to(get_user_info)))
        .service(
            web::resource("/atcoder-api/v3/from/{from}").route(web::get().to(get_time_submissions)),
        );
}

#[derive(Clone)]
pub struct AppData {
    pub(crate) pool: Pool,
}

impl AppData {
    pub fn new<S: Into<String>>(database_url: S) -> Result<Self> {
        let manager = diesel::r2d2::ConnectionManager::<PgConnection>::new(database_url);
        let pool = diesel::r2d2::Pool::builder().build(manager)?;
        Ok(Self { pool })
    }
}
