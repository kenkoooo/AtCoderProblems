use super::{
    RankingRequest, RankingRequestFormat, RankingResponse, RankingSelector, UserRankRequest,
    UserRankResponse, UserRankSelector,
};

use actix_web::{error, web, Result};
use async_trait::async_trait;
use sql_client::{streak::StreakClient, PgPool};

pub(crate) struct StreakRanking;

#[async_trait(?Send)]
impl RankingSelector for StreakRanking {
    type Request = RankingRequest;
    type Response = RankingResponse;
    async fn fetch(pool: web::Data<PgPool>, query: Self::Request) -> Result<Vec<Self::Response>> {
        let ranking = pool
            .load_streak_count_in_range(query.range())
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RankingResponse {
                user_id: entry.user_id,
                count: entry.streak,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl UserRankSelector for StreakRanking {
    type Request = UserRankRequest;
    type Response = UserRankResponse;
    async fn fetch(
        pool: web::Data<PgPool>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let count = match pool.get_users_streak_count(&query.user).await {
            Some(number) => number,
            None => return Ok(None),
        };
        let rank = pool
            .get_streak_count_rank(count)
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(Some(UserRankResponse { count, rank }))
    }
}
