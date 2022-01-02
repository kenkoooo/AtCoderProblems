use super::{
    RankingRequest, RankingRequestFormat, RankingSelector, UserRankRequest,
    UserRankResponse, UserRankSelector, UserSum
};
use crate::server::AppData;

use actix_web::{error, web, Result};
use async_trait::async_trait;
use sql_client::rated_point_sum::RatedPointSumClient;

pub(crate) struct RatedPointSumRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for RatedPointSumRanking {
    type Request = RankingRequest;
    type Response = UserSum;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Vec<Self::Response>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
            .load_rated_point_sum_in_range(query.range())
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking)
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
