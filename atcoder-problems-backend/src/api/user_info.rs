use crate::sql::{AcceptedCountClient, RatedPointSumClient};

use diesel::QueryResult;
use serde::Serialize;

pub fn get_user_info<'a, C>(conn: &C, user_id: &'a str) -> QueryResult<UserInfo<'a>>
where
    C: AcceptedCountClient + RatedPointSumClient,
{
    let accepted_count = conn.get_users_accepted_count(user_id)?;
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count)?;
    let rated_point_sum = conn.get_users_rated_point_sum(user_id)?;
    let rated_point_sum_rank = conn.get_rated_point_sum_rank(rated_point_sum)?;
    Ok(UserInfo {
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    })
}

#[derive(Serialize)]
pub struct UserInfo<'a> {
    user_id: &'a str,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}
