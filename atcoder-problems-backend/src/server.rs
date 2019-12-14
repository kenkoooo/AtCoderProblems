use crate::error::{Error, Result};
use crate::server::middleware::RequestLogger;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::get_user_submissions;

pub(crate) mod auth;
use crate::server::problem_list::{create_list, get_list};
use auth::get_token;
pub use auth::{Authentication, GitHubAuthentication};
use cookie::Cookie;

pub(crate) mod middleware;
pub(crate) mod problem_list;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;

pub(crate) type Pool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<diesel::PgConnection>>;
pub(crate) type PooledConnection =
    diesel::r2d2::PooledConnection<diesel::r2d2::ConnectionManager<diesel::PgConnection>>;

pub async fn run_server<A>(pool: Pool, authentication: A, port: u16) -> Result<()>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    let app_data = AppData::new(pool, authentication);
    let mut app = tide::with_state(app_data);

    app.middleware(RequestLogger::new());
    app.at("/atcoder-api").nest(|api| {
        api.at("/results").get(get_user_submissions);
        api.at("/v2").nest(|api| {
            api.at("/user_info").get(get_user_info);
        });
        api.at("/v3").nest(|api| {
            api.at("/from/:from").get(get_time_submissions);
            api.at("/authorize").get(get_token);
            api.at("/internal").nest(|api| {
                api.at("/list").nest(|api| {
                    api.at("/get").get(get_list);
                    api.at("/create").post(create_list);
                });
            });
        });
    });
    app.at("/healthcheck").get(|_| async move { "" });
    app.listen(format!("0.0.0.0:{}", port)).await?;
    Ok(())
}

pub fn initialize_pool<S: Into<String>>(database_url: S) -> Result<Pool> {
    let manager = diesel::r2d2::ConnectionManager::<diesel::PgConnection>::new(database_url);
    let pool = diesel::r2d2::Pool::builder().build(manager)?;
    Ok(pool)
}

pub(crate) trait CommonRequest {
    fn extract_etag(&self) -> &str;
    fn get_cookie(&self, key: &str) -> Result<String>;
}

impl<T> CommonRequest for tide::Request<T> {
    fn extract_etag(&self) -> &str {
        self.header("if-none-match").unwrap_or_else(|| "no etag")
    }
    fn get_cookie(&self, key: &str) -> Result<String> {
        self.header("cookie")
            .and_then(|s| {
                s.split(';')
                    .flat_map(|row| Cookie::parse(row).ok())
                    .find(|cookie: &Cookie| cookie.name() == key)
            })
            .map(|cookie: Cookie| cookie.value().to_string())
            .ok_or_else(|| Error::CookieNotFound)
    }
}

pub(crate) trait CommonResponse {
    fn ok() -> Self;
    fn new_cors() -> Self;
    fn bad_request() -> Self;
    fn internal_error() -> Self;
    fn not_modified() -> Self;
    fn etagged(etag: &str) -> Self;

    fn set_cookie(self, cookie: cookie::Cookie) -> Self;
}

impl CommonResponse for tide::Response {
    fn ok() -> Self {
        Self::new(200)
    }
    fn new_cors() -> Self {
        Self::ok().set_header("access-control-allow-origin", "*")
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

    fn set_cookie(self, cookie: cookie::Cookie) -> Self {
        self.set_header("Set-Cookie", cookie.to_string())
    }
}

pub(crate) struct AppData<A> {
    pub(crate) pool: Pool,
    pub(crate) authentication: A,
}

impl<A: Clone> Clone for AppData<A> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
            authentication: self.authentication.clone(),
        }
    }
}

impl<A> AppData<A> {
    fn new(pool: Pool, authentication: A) -> Self {
        Self {
            pool,
            authentication,
        }
    }
    pub(crate) fn respond<F>(&self, f: F) -> tide::Response
    where
        F: FnOnce(&diesel::PgConnection) -> Result<tide::Response>,
    {
        match self.pool.get() {
            Ok(conn) => f(&conn).unwrap_or_else(|_| tide::Response::bad_request()),
            _ => tide::Response::internal_error(),
        }
    }
}
