use crate::server::{AppData, CommonResponse};

use crate::sql::{AcceptedCountClient, RatedPointSumClient};
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

pub(crate) async fn get_user_info<A>(request: Request<AppData<A>>) -> Response {
    request.state().respond(|conn| {
        let query = request.query::<Query>()?;
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
        let user_info = Response::new_cors().body_json(&user_info)?;
        Ok(user_info)
    })
}
