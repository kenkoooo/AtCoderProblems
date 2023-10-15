use super::{
    RankingRequest, RankingRequestFormat, RankingResponse, RankingSelector, UserRankRequest,
    UserRankResponse, UserRankSelector,
};

use actix_web::{error, web, Result};
use async_trait::async_trait;
use sql_client::{rated_point_sum::RatedPointSumClient, PgPool};

pub(crate) struct RatedPointSumRanking;

#[async_trait(?Send)]
impl RankingSelector for RatedPointSumRanking {
    type Request = RankingRequest;
    type Response = RankingResponse;
    async fn fetch(pool: web::Data<PgPool>, query: Self::Request) -> Result<Vec<Self::Response>> {
        let ranking = pool
            .load_rated_point_sum_in_range(query.range())
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RankingResponse {
                user_id: entry.user_id,
                count: entry.point_sum,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl UserRankSelector for RatedPointSumRanking {
    type Request = UserRankRequest;
    type Response = UserRankResponse;
    async fn fetch(
        pool: web::Data<PgPool>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let point_sum = pool.get_users_rated_point_sum(&query.user).await;
        let point_sum = match point_sum {
            Some(point_sum) => point_sum,
            None => return Ok(None),
        };

        let rank = pool
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
