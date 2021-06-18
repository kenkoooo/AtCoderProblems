use crate::server::{AppData, CommonResponse};
use serde::{Deserialize, Serialize};
use sql_client::accepted_count::AcceptedCountClient;
use tide::{Request, Response, Result};

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

pub(crate) async fn get_ac_ranking<A>(request: Request<AppData<A>>) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        from: usize,
        to: usize,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let query = (query.from)..(query.to);
    if query.len() > MAX_RANKING_RANGE_LENGTH {
        return Ok(Response::new(400));
    }
    let ranking = conn.load_accepted_count_in_range(query).await?;
    let response = Response::json(&ranking)?;
    Ok(response)
}

pub(crate) async fn get_users_ac_info<A>(request: Request<AppData<A>>) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        user: String,
    }
    #[derive(Debug, Serialize)]
    struct UsersACInfo {
        accepted_count: i32,
        accepted_count_rank: i64,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let user_id = &query.user;
    let accepted_count = match conn.get_users_accepted_count(user_id).await {
        Some(number) => number,
        None => return Ok(Response::new(404)),
    };
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count).await?;
    let users_ac_info = UsersACInfo {
        accepted_count,
        accepted_count_rank,
    };
    let response = Response::json(&users_ac_info)?;
    Ok(response)
}
