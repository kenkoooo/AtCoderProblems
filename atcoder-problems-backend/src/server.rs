use crate::error::Result;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::get_user_submissions;
use diesel::PgConnection;
use http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, IF_NONE_MATCH};

pub mod time_submissions;
pub mod user_info;
pub mod user_submissions;
pub mod utils;

pub(crate) type Pool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>;

pub(crate) fn request_with_connection<F>(pool: &Pool, f: F) -> tide::Response
where
    F: FnOnce(&PgConnection) -> tide::Response,
{
    match pool.get() {
        Ok(conn) => f(&conn),
        _ => tide::Response::new(503),
    }
}

pub(crate) trait EtagExtractor {
    fn extract_etag(&self) -> &str;
}

impl<T> EtagExtractor for tide::Request<T> {
    fn extract_etag(&self) -> &str {
        self.header(IF_NONE_MATCH.as_str())
            .unwrap_or_else(|| "no etag")
    }
}

pub(crate) fn create_cors_response() -> tide::Response {
    tide::Response::new(200).set_header(ACCESS_CONTROL_ALLOW_ORIGIN.as_str(), "*")
}

pub fn config_route(mut app: tide::Server<AppData>) -> tide::Server<AppData> {
    app.at("/atcoder-api").nest(|api| {
        api.at("/results").get(get_user_submissions);
        api.at("/v2").nest(|api| {
            api.at("/user_info").get(get_user_info);
        });
        api.at("/v3").nest(|api| {
            api.at("/from/:from").get(get_time_submissions);
        });
    });
    app.at("/healthcheck").get(|_| async move { "" });
    app
}

#[derive(Clone)]
pub struct AppData {
    pub pool: Pool,
}

impl AppData {
    pub fn new<S: Into<String>>(database_url: S) -> Result<Self> {
        let manager = diesel::r2d2::ConnectionManager::<PgConnection>::new(database_url);
        let pool = diesel::r2d2::Pool::builder().build(manager)?;
        Ok(Self { pool })
    }
}
