use crate::server::{AppData, CommonResponse};

use crate::error::ToAnyhowError;
use crate::sql::{AcceptedCountClient, RatedPointSumClient};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tide::{Request, Response};

#[derive(Deserialize)]
struct Query {
    user: String,
}
#[derive(Serialize)]
struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}

pub(crate) async fn get_user_info<A>(request: Request<AppData<A>>) -> Result<Response> {
    let conn = request.state().pool.get()?;
    let query = request.query::<Query>().map_anyhow()?;
    let user_id = query.user;
    let accepted_count = conn.get_users_accepted_count(&user_id).unwrap_or(0);
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count)?;
    let rated_point_sum = conn.get_users_rated_point_sum(&user_id).unwrap_or(0.0);
    let rated_point_sum_rank = conn.get_rated_point_sum_rank(rated_point_sum)?;

    let user_info = UserInfo {
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    };
    let response = Response::json(&user_info)?.make_cors();
    Ok(response)
}
