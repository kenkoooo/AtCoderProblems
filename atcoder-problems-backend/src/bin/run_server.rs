use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use atcoder_problems_backend::server::user_info::get_user_info;
use atcoder_problems_backend::server::user_submissions::get_user_submissions;
use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    let url = env::var("SQL_URL")?;
    let manager = ConnectionManager::<PgConnection>::new(url);
    let pool = diesel::r2d2::Pool::builder().build(manager)?;

    HttpServer::new(move || {
        App::new()
            .data(pool.clone())
            .wrap(middleware::Compress::default())
            .wrap(middleware::Logger::default())
            .service(
                web::resource("/atcoder-api/results").route(web::get().to(get_user_submissions)),
            )
            .service(web::resource("/atcoder-api/v2/user_info").route(web::get().to(get_user_info)))
            .service(web::resource("/atcoder-api/v3/from/").route(web::get().to(get_user_info)))
            .default_service(
                web::resource("").route(web::route().to(HttpResponse::MethodNotAllowed)),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()?;
    Ok(())
}
