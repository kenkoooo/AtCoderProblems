use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use sql_client::{language_count::LanguageCountClient, PgPool};

pub(crate) async fn get_language_list(
    _request: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let languages = pool
        .load_languages()
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::Ok().json(&languages);
    Ok(response)
}
