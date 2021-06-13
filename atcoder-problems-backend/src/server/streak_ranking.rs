use crate::server::{AppData, CommonResponse};
use serde::Deserialize;
use sql_client::streak::StreakClient;
use tide::{Request, Response, Result};

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

pub(crate) async fn get_streak_ranking<A>(request: Request<AppData<A>>) -> Result<Response> {
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
    let ranking = conn.load_streak_count_in_range(query).await?;
    let response = Response::json(&ranking)?;
    Ok(response)
}

pub(crate) async fn get_users_streak_rank<A>(request: Request<AppData<A>>) -> Result<Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        user: String
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let user_id = &query.user;
    let streak_count = match conn.get_users_streak_count(user_id).await {
        Some(number) => number,
        None => return Ok(Response::new(404)),
    };
    let rank = conn.get_streak_count_rank(streak_count).await?;
    let response = Response::json(&rank)?;
    Ok(response)
}