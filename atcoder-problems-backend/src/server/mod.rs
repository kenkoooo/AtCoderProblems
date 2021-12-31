pub(crate) mod auth;
pub(crate) mod internal_user;
pub(crate) mod language_count;
pub(crate) mod middleware;
pub(crate) mod problem_list;
pub(crate) mod progress_reset;
pub(crate) mod ranking;
pub(crate) mod rated_point_sum_ranking;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;
pub(crate) mod virtual_contest;
pub(crate) mod services;

pub use auth::{Authentication, GitHubAuthentication, GitHubUserResponse};
use actix_web::{web, App, HttpServer, HttpResponse, http::header};

pub async fn run_server<A>(
    pg_pool: sql_client::PgPool,
    authentication: A,
    port: u16,
) -> std::io::Result<()>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    let host = "0.0.0.0";
    let app_data = AppData::new(pg_pool, authentication);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_data.clone()))
            .wrap(actix_web::middleware::Logger::default())
            .configure(services::config_services)
    })
    .bind((host, port))?
    .run()
    .await
}

pub(crate) trait CommonResponse {
    fn ok() -> Self;
    fn json<S: serde::Serialize>(body: &S) -> actix_web::Result<Self>
    where
        Self: Sized;
    fn empty_json() -> Self;
    fn make_cors(self) -> Self;
}

impl CommonResponse for HttpResponse {
    fn ok() -> Self {
        Self::Ok().finish()
    }
    fn json<S: serde::Serialize>(body: &S) -> actix_web::Result<Self>
    where
        Self: Sized,
    {
        let response = Self::Ok().json(body);
        Ok(response)
    }
    fn empty_json() -> Self {
        Self::Ok().json("{}")
    }
    fn make_cors(self) -> Self {
        let mut response = self;
        response.headers_mut().insert(
            header::ACCESS_CONTROL_ALLOW_ORIGIN,
            header::HeaderValue::from_str("*").unwrap()
        );
        response
    }
}

pub(crate) struct AppData<A> {
    pub(crate) authentication: A,
    pub(crate) pg_pool: sql_client::PgPool,
}

impl<A: Clone> Clone for AppData<A> {
    fn clone(&self) -> Self {
        Self {
            pg_pool: self.pg_pool.clone(),
            authentication: self.authentication.clone(),
        }
    }
}

impl<A> AppData<A> {
    fn new(pg_pool: sql_client::PgPool, authentication: A) -> Self {
        Self {
            authentication,
            pg_pool,
        }
    }
}
