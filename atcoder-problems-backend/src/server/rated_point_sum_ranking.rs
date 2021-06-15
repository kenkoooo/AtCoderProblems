use crate::server::{AppData, CommonResponse};
use serde::Deserialize;
use sql_client::rated_point_sum::RatedPointSumClient;
use tide::{Request, Response, Result};

const MAX_RANKING_RANGE_LENGTH: usize = 1000;

pub(crate) async fn get_rated_point_sum_ranking<A>(request: Request<AppData<A>>) -> Result<Response> {
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

    let ranking = conn.load_rated_point_sum_in_range(query).await?;
    let response = Response::json(&ranking)?;
    Ok(response)
}
