use super::{
    LanguageRankingRequest, LanguageUserRankResponse, RankingRequestFormat, RankingResponse,
    RankingSelector, UserRankRequest, UserRankSelector,
};

use actix_web::{error, web, Result};
use async_trait::async_trait;
use sql_client::{language_count::LanguageCountClient, PgPool};

pub(crate) struct LanguageRanking;

#[async_trait(?Send)]
impl RankingSelector for LanguageRanking {
    type Request = LanguageRankingRequest;
    type Response = RankingResponse;
    async fn fetch(pool: web::Data<PgPool>, query: Self::Request) -> Result<Vec<Self::Response>> {
        let ranking = pool
            .load_language_count_in_range(&query.language, query.range())
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
impl UserRankSelector for LanguageRanking {
    type Request = UserRankRequest;
    type Response = Vec<LanguageUserRankResponse>;
    async fn fetch(
        pool: web::Data<PgPool>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let counts = pool
            .load_users_language_count(&query.user)
            .await
            .map_err(error::ErrorInternalServerError)?;
        let ranks = pool
            .load_users_language_count_rank(&query.user)
            .await
            .map_err(error::ErrorInternalServerError)?;
        let info = counts
            .into_iter()
            .zip(ranks)
            .map(|(c, r)| LanguageUserRankResponse {
                language: c.simplified_language,
                count: c.problem_count as i64,
                rank: r.rank,
            })
            .collect::<Vec<_>>();
        Ok(Some(info))
    }
}
