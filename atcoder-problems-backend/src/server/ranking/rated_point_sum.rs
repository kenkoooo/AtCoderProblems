use super::{
    RankingRequest, RankingRequestFormat, RankingResponseFormat, RankingSelector, UserRankRequest,
    UserRankResponse, UserRankSelector,
};
use crate::server::AppData;

use actix_web::{error, web, Result};
use async_trait::async_trait;
use serde::Serialize;
use sql_client::rated_point_sum::RatedPointSumClient;

#[deprecated(
    note = "this special Response type is deprecated and will be replaced with super::RankingResponse"
)]
#[derive(Debug, Serialize)]
pub(crate) struct RPSRankingResponse {
    user_id: String,
    count: i64,
    point_sum: i64,
}

impl RankingResponseFormat for RPSRankingResponse {}

pub(crate) struct RatedPointSumRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for RatedPointSumRanking {
    type Request = RankingRequest;
    type Response = RPSRankingResponse;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Vec<Self::Response>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
            .load_rated_point_sum_in_range(query.range())
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RPSRankingResponse {
                user_id: entry.user_id,
                count: entry.point_sum,
                point_sum: entry.point_sum,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for RatedPointSumRanking {
    type Request = UserRankRequest;
    type Response = UserRankResponse;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let conn = data.pg_pool.clone();
        let point_sum = conn.get_users_rated_point_sum(&query.user).await;
        let point_sum = match point_sum {
            Some(point_sum) => point_sum,
            None => return Ok(None),
        };

        let rank = conn
            .get_rated_point_sum_rank(point_sum)
            .await
            .map_err(error::ErrorInternalServerError)?;
        let response = UserRankResponse {
            count: point_sum,
            rank,
        };
        Ok(Some(response))
    }
}
