use crate::server::{AppData, CommonResponse};

use serde::{Deserialize, Serialize};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::rated_point_sum::RatedPointSumClient;
use tide::{Request, Response, Result};

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
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let user_id = query.user;
    let accepted_count = conn.get_users_accepted_count(&user_id).await.unwrap_or(0);
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count).await?;
    let rated_point_sum = conn
        .get_users_rated_point_sum(&user_id)
        .await
        .unwrap_or(0.0);
    let rated_point_sum_rank = conn.get_rated_point_sum_rank(rated_point_sum).await?;

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
