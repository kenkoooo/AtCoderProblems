use crate::error::Result;
use crate::server::middleware::RequestLogger;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::get_user_submissions;
use diesel::PgConnection;

pub(crate) mod auth;
pub use auth::GitHubAuthentication;

pub(crate) mod middleware;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;

pub async fn run_server(app_data: AppData, port: u16) -> Result<()> {
    let mut app = tide::with_state(app_data);

    app.middleware(RequestLogger::new());
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
    app.listen(format!("0.0.0.0:{}", port)).await?;
    Ok(())
}

pub(crate) trait EtagExtractor {
    fn extract_etag(&self) -> &str;
}

impl<T> EtagExtractor for tide::Request<T> {
    fn extract_etag(&self) -> &str {
        self.header("if-none-match").unwrap_or_else(|| "no etag")
    }
}

pub(crate) trait CommonResponse {
    fn new_cors() -> Self;
    fn bad_request() -> Self;
    fn internal_error() -> Self;
    fn not_modified() -> Self;
    fn etagged(etag: &str) -> Self;
}

impl CommonResponse for tide::Response {
    fn new_cors() -> Self {
        Self::new(200).set_header("access-control-allow-origin", "*")
    }
    fn bad_request() -> Self {
        Self::new(400)
    }
    fn internal_error() -> Self {
        Self::new(503)
    }
    fn not_modified() -> Self {
        Self::new(304)
    }
    fn etagged(etag: &str) -> Self {
        Self::new_cors().set_header("etag", etag)
    }
}

#[derive(Clone)]
pub struct AppData {
    pub(crate) pool: diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>,
    pub(crate) authentication: GitHubAuthentication,
}

impl AppData {
    pub fn new<S: Into<String>>(
        database_url: S,
        authentication: GitHubAuthentication,
    ) -> Result<Self> {
        let manager = diesel::r2d2::ConnectionManager::<PgConnection>::new(database_url);
        let pool = diesel::r2d2::Pool::builder().build(manager)?;
        Ok(Self {
            pool,
            authentication,
        })
    }

    pub(crate) fn respond<F>(&self, f: F) -> tide::Response
    where
        F: FnOnce(&PgConnection) -> Result<tide::Response>,
    {
        match self.pool.get() {
            Ok(conn) => f(&conn).unwrap_or_else(|_| tide::Response::bad_request()),
            _ => tide::Response::internal_error(),
        }
    }
}
