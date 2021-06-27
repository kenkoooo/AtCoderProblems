use crate::server::{AppData, CommonResponse};
use serde::{Deserialize};
use sql_client::language_count::LanguageCountClient;
use tide::{Request, Response, Result};

pub(crate) async fn get_language_list<A>(request: Request<AppData<A>>) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {}
    let conn = request.state().pg_pool.clone();
    let _ = request.query::<Query>()?;
    let languages = conn.load_languages().await?;
    let response = Response::json(&languages)?;
    Ok(response)
}
