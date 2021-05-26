use crate::server::{AppData, CommonResponse};
use sql_client::accepted_count::AcceptedCountClient;
use std::ops::Range;
use tide::{Request, Response, Result};

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

pub(crate) async fn get_ac_ranking<A>(request: Request<AppData<A>>) -> Result<Response> {
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Range<usize>>()?;
    if query.len() > MAX_RANKING_RANGE_LENGTH {
        return Ok(Response::new(400));
    }
    let ranking = conn.load_accepted_count_in_range(query).await?;
    let response = Response::json(&ranking)?;
    Ok(response)
}
