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
