pub(crate) mod auth;
pub(crate) mod internal_user;
pub(crate) mod language_count;
pub(crate) mod problem_list;
pub(crate) mod progress_reset;
pub(crate) mod ranking;
pub(crate) mod services;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;
pub(crate) mod virtual_contest;

use actix_web::{http::header, web, App, HttpResponseBuilder, HttpServer};
pub use auth::{Authentication, GitHubAuthentication, GitHubUserResponse};

const LOG_TEMPLATE: &str = r#"{"method":"%{method}xi", "url":"%U", "status":%s, "duration":%T}"#;

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
            .wrap(
                actix_web::middleware::Logger::new(LOG_TEMPLATE)
                    .custom_request_replace("method", |req| req.method().to_string()),
            )
            .configure(services::config_services::<A>)
    })
    .bind((host, port))?
    .run()
    .await
}

pub(crate) trait MakeCors {
    fn make_cors(&mut self) -> &mut Self;
}

impl MakeCors for HttpResponseBuilder {
    fn make_cors(&mut self) -> &mut Self {
        self.insert_header((header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"))
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
