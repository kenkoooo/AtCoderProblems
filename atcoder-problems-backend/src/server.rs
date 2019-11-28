use actix_web::{web, HttpRequest, HttpResponse};
use diesel::PgConnection;

pub mod user_info;
pub mod user_submissions;

pub(crate) type ConnectionManager = diesel::r2d2::ConnectionManager<PgConnection>;
pub(crate) type Pool = diesel::r2d2::Pool<ConnectionManager>;

pub(crate) fn request_with_connection<F>(
    request: HttpRequest,
    pool: web::Data<Pool>,
    f: F,
) -> HttpResponse
where
    F: Fn(HttpRequest, &PgConnection) -> HttpResponse,
{
    match pool.get() {
        Ok(conn) => f(request, &conn),
        _ => HttpResponse::ServiceUnavailable().finish(),
    }
}
