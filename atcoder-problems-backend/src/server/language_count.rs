use crate::server::AppData;
use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use sql_client::language_count::LanguageCountClient;

pub(crate) async fn get_language_list<A>(
    _request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let languages = conn
        .load_languages()
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::Ok().json(&languages);
    Ok(response)
}
