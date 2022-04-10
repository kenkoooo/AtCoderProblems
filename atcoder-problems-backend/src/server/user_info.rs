use crate::server::MakeCors;

use actix_web::{error, web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::PgPool;

#[derive(Deserialize)]
pub(crate) struct Query {
    user: String,
}
#[derive(Serialize)]
struct UserInfo {
    user_id: String,
    accepted_count: i64,
    accepted_count_rank: i64,
    rated_point_sum: i64,
    rated_point_sum_rank: i64,
}

pub(crate) async fn get_user_info(
    pool: web::Data<PgPool>,
    query: web::Query<Query>,
) -> Result<HttpResponse> {
    let user_id = &query.user;
    let accepted_count = pool.get_users_accepted_count(user_id).await.unwrap_or(0);
    let accepted_count_rank = pool
        .get_accepted_count_rank(accepted_count)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let rated_point_sum = pool.get_users_rated_point_sum(user_id).await.unwrap_or(0);
    let rated_point_sum_rank = pool
        .get_rated_point_sum_rank(rated_point_sum)
        .await
        .map_err(error::ErrorInternalServerError)?;

    let user_info = UserInfo {
        user_id: user_id.clone(),
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    };
    let response = HttpResponse::Ok().make_cors().json(&user_info);
    Ok(response)
}
