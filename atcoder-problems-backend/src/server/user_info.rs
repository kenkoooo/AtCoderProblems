use crate::error::Result;
use crate::server::{create_cors_response, request_with_connection, AppData};

use crate::sql::{AcceptedCountClient, RatedPointSumClient};
use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};

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

pub(crate) async fn get_user_info(request: HttpRequest, data: web::Data<AppData>) -> HttpResponse {
    request_with_connection(&data.pool, move |conn| match inner(conn, request) {
        Ok(user_info) => create_cors_response().json(user_info),
        _ => HttpResponse::BadRequest().finish(),
    })
}

fn inner<C: AcceptedCountClient + RatedPointSumClient>(
    conn: &C,
    request: HttpRequest,
) -> Result<UserInfo> {
    let web::Query(query) = web::Query::<Query>::from_query(request.query_string())?;
    let user_id = query.user;
    let accepted_count = conn.get_users_accepted_count(&user_id)?;
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count)?;
    let rated_point_sum = conn.get_users_rated_point_sum(&user_id)?;
    let rated_point_sum_rank = conn.get_rated_point_sum_rank(rated_point_sum)?;
    Ok(UserInfo {
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    })
}
