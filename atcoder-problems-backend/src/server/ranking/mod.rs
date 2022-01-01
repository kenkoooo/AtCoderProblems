use crate::server::{AppData, CommonResponse};

use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::language_count::LanguageCountClient;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::streak::StreakClient;
use std::ops::Range;
use async_trait::async_trait;

#[derive(Deserialize)]
pub(crate) struct UserRankRequest {
    user: String,
}

#[derive(Serialize)]
pub(crate) struct UserRankResponse {
    count: i64,
    rank: i64,
}

#[derive(Deserialize)]
pub(crate) struct RankingRequest {
    from: usize,
    to: usize,
}

#[derive(Serialize)]
pub(crate) struct RankingResponseEntry {
    user_id: String,
    count: i64,
}

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

// HttpRequest が Sync + Send でないエラーはこれで解消する
// 実行時に問題があるようであれば (?Send) は外し、ranking の引数から request を除けば良さそう
#[async_trait(?Send)]
pub(crate) trait RankingSelector<A: Sync + Send + Clone + 'static> {
    async fn fetch(data: web::Data<AppData<A>>, query: Range<usize>) -> Result<Vec<RankingResponseEntry>>;
    async fn get_ranking(_request: HttpRequest, data: web::Data<AppData<A>>, query: web::Query<RankingRequest>) -> Result<HttpResponse> {
        let query = (query.from)..(query.to);
        if query.len() > MAX_RANKING_RANGE_LENGTH {
            return Ok(HttpResponse::BadRequest().finish());
        }
        let ranking = Self::fetch(data, query).await?;
        let response = HttpResponse::json(&ranking)?;
        <Result<HttpResponse>>::Ok(response)
    }
}

#[async_trait(?Send)]
pub(crate) trait UserRankSelector<A: Sync + Send + Clone + 'static> {
    async fn fetch(data: web::Data<AppData<A>>, query: &str) -> Result<Option<UserRankResponse>>;
    async fn get_users_rank(_request: HttpRequest, data: web::Data<AppData<A>>, query: web::Query<UserRankRequest>) -> Result<HttpResponse> {
        let user_rank = Self::fetch(data, &query.user).await?;
        // map と ok_or に書き換えられる
        match user_rank {
            Some(rank) => {
                let response = HttpResponse::json(&rank)?;
                <Result<HttpResponse>>::Ok(response)
            }
            None => Ok(HttpResponse::NotFound().finish()),
        }
    }
}

pub(crate) struct StreakRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for StreakRanking {
    async fn fetch(data: web::Data<AppData<A>>, query: Range<usize>) -> Result<Vec<RankingResponseEntry>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
            .load_streak_count_in_range(query)
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RankingResponseEntry {
                user_id: entry.user_id,
                count: entry.streak,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for StreakRanking {
    async fn fetch(data: web::Data<AppData<A>>, user_id: &str) -> Result<Option<UserRankResponse>> {
        let conn = data.pg_pool.clone();
        let count = match conn.get_users_streak_count(user_id).await {
            Some(number) => number,
            None => return Ok(None),
        };
        let rank = conn
            .get_streak_count_rank(count)
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(Some(UserRankResponse { count, rank }))
    }
}

pub(crate) struct AcRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> RankingSelector<A> for AcRanking {
    async fn fetch(data: web::Data<AppData<A>>, query: Range<usize>) -> Result<Vec<RankingResponseEntry>> {
        let conn = data.pg_pool.clone();
        let ranking = conn
            .load_accepted_count_in_range(query)
            .await
            .map_err(error::ErrorInternalServerError)?;
        Ok(ranking
            .into_iter()
            .map(|entry| RankingResponseEntry {
                user_id: entry.user_id,
                count: entry.problem_count as i64,
            })
            .collect())
    }
}

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for AcRanking {
    async fn fetch(data: web::Data<AppData<A>>, user_id: &str) -> Result<Option<UserRankResponse>> {
        let conn = data.pg_pool.clone();
        let count = match conn.get_users_accepted_count(user_id).await {
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

#[derive(Deserialize)]
pub(crate) struct LanguageQuery {
    from: usize,
    to: usize,
    language: String,
}

pub(crate) async fn get_language_ranking<A>(
    _request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<LanguageQuery>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let range = (query.from)..(query.to);
    if range.len() > MAX_RANKING_RANGE_LENGTH {
        return Ok(HttpResponse::BadRequest().finish());
    }

    let ranking = conn
        .load_language_count_in_range(&query.language, range)
        .await
        .map_err(error::ErrorInternalServerError)?;
    let ranking = ranking
        .into_iter()
        .map(|entry| RankingResponseEntry {
            user_id: entry.user_id,
            count: entry.problem_count as i64,
        })
        .collect::<Vec<_>>();
    let response = HttpResponse::json(&ranking)?;
    Ok(response)
}

#[derive(Debug, Deserialize)]
pub(crate) struct UsersLanguageQuery {
    user: String,
}

pub(crate) async fn get_users_language_rank<A>(
    _request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<UsersLanguageQuery>,
) -> Result<HttpResponse> {
    #[derive(Debug, Serialize)]
    struct UsersLanguageResponse {
        language: String,
        count: i64,
        rank: i64,
    }
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
        .map(|(c, r)| UsersLanguageResponse {
            language: c.simplified_language,
            count: c.problem_count as i64,
            rank: r.rank,
        })
        .collect::<Vec<_>>();
    let response = HttpResponse::json(&info)?;
    Ok(response)
}

pub(crate) struct RatedPointSumRanking;

#[async_trait(?Send)]
impl<A: Sync + Send + Clone + 'static> UserRankSelector<A> for RatedPointSumRanking {
    async fn fetch(data: web::Data<AppData<A>>, user_id: &str) -> Result<Option<UserRankResponse>> {
        let conn = data.pg_pool.clone();
        let point_sum = conn.get_users_rated_point_sum(user_id).await;
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
