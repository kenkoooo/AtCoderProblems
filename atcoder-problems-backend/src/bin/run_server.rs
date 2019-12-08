use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use atcoder_problems_backend::server;
use atcoder_problems_backend::server::AppData;
use futures::executor::block_on;
use std::env;
use std::error::Error;

async fn run_server() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    let url = env::var("SQL_URL")?;
    let data = AppData::new(url)?;

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Compress::default())
            .wrap(middleware::Logger::default())
            .configure(|cfg| server::config(cfg, data.clone()))
            .default_service(
                web::resource("").route(web::route().to(HttpResponse::MethodNotAllowed)),
            )
    })
    .bind("0.0.0.0:8080")
    .expect("")
    .start()
    .await?;
    Ok(())
}

fn main() {
    let _ = actix_rt::System::new("server");
    block_on(run_server()).expect("Failed to run the server");
}
