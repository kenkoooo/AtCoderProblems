use crate::server::{AppData, CommonResponse};
use serde::{Deserialize};
use sql_client::language_count::LanguageCountClient;
use tide::{Request, Response, Result};

pub(crate) async fn get_users_language_count_rank<A>(request: Request<AppData<A>>) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        user: String,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let rank = conn.load_users_language_count_rank(&query.user).await?;
    if !rank.is_empty() {
        let response = Response::json(&rank)?;
        Ok(response)
    } else {
        Ok(Response::new(404))
    }
}
