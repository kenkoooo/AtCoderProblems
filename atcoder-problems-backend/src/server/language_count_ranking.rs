use crate::server::{AppData, CommonResponse};
use serde::{Deserialize, Serialize};
use sql_client::language_count::LanguageCountClient;
use tide::{Request, Response, Result};

pub(crate) async fn get_users_language_count_rank<A>(
    request: Request<AppData<A>>,
) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        user: String,
    }
    #[derive(Debug, Serialize)]
    struct UsersLanguageInfo {
        language: String,
        count: i64,
        rank: i64,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let counts = conn.load_users_language_count(&query.user).await?;
    let ranks = conn.load_users_language_count_rank(&query.user).await?;
    let info = counts
        .into_iter()
        .zip(ranks)
        .map(|(c, r)| UsersLanguageInfo {
            language: c.simplified_language,
            count: c.problem_count as i64,
            rank: r.rank,
        })
        .collect::<Vec<_>>();
    let response = Response::json(&info)?;
    Ok(response)
}
