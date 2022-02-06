use actix_web::{web, HttpRequest, HttpResponse, Result};
use async_trait::async_trait;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use sql_client::{models::UserSum, PgPool};
use std::ops::Range;

pub(crate) mod ac_count;
pub(crate) mod language;
pub(crate) mod rated_point_sum;
pub(crate) mod streak;

pub(crate) use {
    ac_count::AcRanking, language::LanguageRanking, rated_point_sum::RatedPointSumRanking,
    streak::StreakRanking,
};

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

pub(crate) trait RankingRequestFormat: DeserializeOwned {
    fn range(&self) -> Range<usize>;
}

pub(crate) trait RankingResponseFormat: Serialize {}

#[async_trait(?Send)]
pub(crate) trait RankingSelector {
    type Request: RankingRequestFormat;
    type Response: RankingResponseFormat;
    async fn fetch(pool: web::Data<PgPool>, query: Self::Request) -> Result<Vec<Self::Response>>;
    async fn get_ranking(
        _request: HttpRequest,
        pool: web::Data<PgPool>,
        query: web::Query<Self::Request>,
    ) -> Result<HttpResponse> {
        let range = query.range();
        if range.len() > MAX_RANKING_RANGE_LENGTH {
            return Ok(HttpResponse::BadRequest().finish());
        }
        let ranking = Self::fetch(pool, query.into_inner()).await?;
        let response = HttpResponse::Ok().json(&ranking);
        Ok(response)
    }
}

pub(crate) trait UserRankRequestFormat: DeserializeOwned {}

pub(crate) trait UserRankResponseFormat: Serialize {}
impl<T: UserRankResponseFormat> UserRankResponseFormat for Vec<T> {}

#[async_trait(?Send)]
pub(crate) trait UserRankSelector {
    type Request: UserRankRequestFormat;
    type Response: UserRankResponseFormat;
    async fn fetch(pool: web::Data<PgPool>, query: Self::Request)
        -> Result<Option<Self::Response>>;
    async fn get_users_rank(
        _request: HttpRequest,
        pool: web::Data<PgPool>,
        query: web::Query<Self::Request>,
    ) -> Result<HttpResponse> {
        let user_rank = Self::fetch(pool, query.into_inner()).await?;
        // map と ok_or に書き換えられる
        match user_rank {
            Some(rank) => {
                let response = HttpResponse::Ok().json(&rank);
                Ok(response)
            }
            None => Ok(HttpResponse::NotFound().finish()),
        }
    }
}

// ranking requests
#[derive(Deserialize)]
pub(crate) struct RankingRequest {
    from: usize,
    to: usize,
}

impl RankingRequestFormat for RankingRequest {
    fn range(&self) -> Range<usize> {
        (self.from)..(self.to)
    }
}

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

// ranking responses
#[derive(Serialize)]
pub(crate) struct RankingResponse {
    user_id: String,
    count: i64,
}

impl RankingResponseFormat for RankingResponse {}

impl RankingResponseFormat for UserSum {}

// user rank requests
#[derive(Deserialize)]
pub(crate) struct UserRankRequest {
    user: String,
}

impl UserRankRequestFormat for UserRankRequest {}

// user rank responses
#[derive(Serialize)]
pub(crate) struct UserRankResponse {
    count: i64,
    rank: i64,
}

impl UserRankResponseFormat for UserRankResponse {}

#[derive(Debug, Serialize)]
pub(crate) struct LanguageUserRankResponse {
    language: String,
    count: i64,
    rank: i64,
}

impl UserRankResponseFormat for LanguageUserRankResponse {}
