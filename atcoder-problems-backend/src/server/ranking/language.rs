use super::{
    UserRankResponseFormat, RankingRequestFormat, RankingResponse, RankingSelector, UserRankRequest, UserRankSelector,
};
use crate::server::AppData;

use actix_web::{error, web, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use sql_client::language_count::LanguageCountClient;
use std::ops::Range;


#[derive(Deserialize)]
pub(crate) struct LanguageRankingRequest {
    from: usize,
    to: usize,
    language: String,
}

impl RankingRequestFormat for LanguageRankingRequest {
    fn range(&self) -> Range<usize> {
        (self.from)..(self.to)
    }
}

#[derive(Debug, Serialize)]
pub(crate) struct LanguageUserRankResponse {
    language: String,
    count: i64,
    rank: i64,
}

impl UserRankResponseFormat for LanguageUserRankResponse {}

pub(crate) struct LanguageRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for LanguageRanking {
    type Request = LanguageRankingRequest;
    type Response = RankingResponse;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Vec<Self::Response>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
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
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for LanguageRanking {
    type Request = UserRankRequest;
    type Response = Vec<LanguageUserRankResponse>;
    async fn fetch(
        data: web::Data<AppData<A>>,
        query: Self::Request,
    ) -> Result<Option<Self::Response>> {
        let conn = data.pg_pool.clone();
        let counts = conn
            .load_users_language_count(&query.user)
            .await
            .map_err(error::ErrorInternalServerError)?;
        let ranks = conn
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
