use super::{
    RankingRequest, RankingRequestFormat, RankingResponse, RankingSelector, UserRankRequest,
    UserRankResponse, UserRankSelector,
};
use crate::server::AppData;

use actix_web::{error, web, Result};
use async_trait::async_trait;
use sql_client::accepted_count::AcceptedCountClient;

pub(crate) struct AcRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for AcRanking {
    type Request = RankingRequest;
    type Response = RankingResponse;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Vec<Self::Response>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
            .load_accepted_count_in_range(query.range())
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RankingResponse {
                user_id: entry.user_id,
                count: entry.problem_count as i64,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for AcRanking {
    type Request = UserRankRequest;
    type Response = UserRankResponse;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let conn = data.pg_pool.clone();
        let count = match conn.get_users_accepted_count(&query.user).await {
            Some(number) => number,
            None => return Ok(None),
        };
        let rank = conn
            .get_accepted_count_rank(count)
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(Some(UserRankResponse { count, rank }))
    }
}