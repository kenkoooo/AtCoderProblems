use crate::server::{AppData, CommonResponse};
use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::Deserialize;
use sql_client::rated_point_sum::RatedPointSumClient;

const MAX_RANKING_RANGE_LENGTH: usize = 1000;

#[derive(Debug, Deserialize)]
pub(crate) struct Query {
    from: usize,
    to: usize,
}

pub(crate) async fn get_rated_point_sum_ranking<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<Query>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let query = (query.from)..(query.to);
    if query.len() > MAX_RANKING_RANGE_LENGTH {
        return Ok(HttpResponse::BadRequest().finish());
    }

    let ranking = conn
        .load_rated_point_sum_in_range(query)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&ranking)?;
    Ok(response)
}
