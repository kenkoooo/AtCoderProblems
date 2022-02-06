use actix_web::{get, HttpResponse, Responder};

#[get("/healthcheck")]
pub async fn get_healthcheck() -> impl Responder {
    HttpResponse::Ok().finish()
}
