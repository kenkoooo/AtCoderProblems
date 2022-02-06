pub mod endpoint;
pub mod error;
pub(crate) mod language_count;
pub mod middleware;
pub(crate) mod ranking;
pub(crate) mod services;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;

use actix_web::{http::header, web, App, HttpResponseBuilder, HttpServer};
use anyhow::Result;
pub use services::config_services;

use self::middleware::github_auth::{GithubAuthentication, GithubClient};

const LOG_TEMPLATE: &str = r#"{"method":"%{method}xi", "url":"%U", "status":%s, "duration":%T}"#;

pub async fn run_server(
    pg_pool: sql_client::PgPool,
    github_client: GithubClient,
    port: u16,
) -> Result<()> {
    let host = "0.0.0.0";
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pg_pool.clone()))
            .wrap(GithubAuthentication::new(github_client.clone()))
            .wrap(
                actix_web::middleware::Logger::new(LOG_TEMPLATE)
                    .custom_request_replace("method", |req| req.method().to_string()),
            )
            .configure(services::config_services)
    })
    .bind((host, port))?
    .run()
    .await?;
    Ok(())
}

pub(crate) trait MakeCors {
    fn make_cors(&mut self) -> &mut Self;
}

impl MakeCors for HttpResponseBuilder {
    fn make_cors(&mut self) -> &mut Self {
        self.insert_header((header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"))
    }
}
