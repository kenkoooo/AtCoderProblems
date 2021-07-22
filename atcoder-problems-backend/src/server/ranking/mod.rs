use crate::server::{AppData, CommonResponse};
use serde::{Deserialize, Serialize};
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::language_count::LanguageCountClient;
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::streak::StreakClient;
use std::ops::Range;
use tide::Result;

#[derive(Deserialize)]
struct UserRankRequest {
    user: String,
}

#[derive(Serialize)]
pub(crate) struct UserRankResponse {
    count: i64,
    rank: i64,
}

#[derive(Deserialize)]
struct RankingRequest {
    from: usize,
    to: usize,
}

#[derive(Serialize)]
pub(crate) struct RankingResponseEntry {
    user_id: String,
    count: i64,
}

const MAX_RANKING_RANGE_LENGTH: usize = 1_000;

pub(crate) fn ranking<State, Fut, F>(f: F) -> impl tide::Endpoint<State>
where
    State: Send + Sync + 'static + Clone,
    F: Sync + Send + 'static + Copy + Fn(State, Range<usize>) -> Fut,
    Fut: std::future::Future<Output = tide::Result<Vec<RankingResponseEntry>>> + Send + 'static,
{
    move |request: tide::Request<State>| async move {
        let state = request.state().clone();
        let query = request.query::<RankingRequest>()?;
        let query = (query.from)..(query.to);
        if query.len() > MAX_RANKING_RANGE_LENGTH {
            return Ok(tide::Response::new(400));
        }
        let ranking = f(state, query).await?;
        let response = tide::Response::json(&ranking)?;
        Ok(response)
    }
}

pub(crate) fn user_rank<State, Fut, F>(f: F) -> impl tide::Endpoint<State>
where
    State: Send + Sync + 'static + Clone,
    F: Fn(State, String) -> Fut + Sync + Send + 'static + Copy,
    Fut: std::future::Future<Output = tide::Result<Option<UserRankResponse>>> + Send + 'static,
{
    move |request: tide::Request<State>| async move {
        let state = request.state().clone();
        let query = request.query::<UserRankRequest>()?;
        let user_rank = f(state, query.user).await?;
        match user_rank {
            Some(rank) => {
                let response = tide::Response::json(&rank)?;
                Ok(response)
            }
            None => Ok(tide::Response::new(404)),
        }
    }
}

pub(crate) async fn get_streak_ranking<A>(
    state: AppData<A>,
    query: Range<usize>,
) -> Result<Vec<RankingResponseEntry>> {
    let conn = state.pg_pool.clone();
    let ranking = conn.load_streak_count_in_range(query).await?;
    Ok(ranking
        .into_iter()
        .map(|entry| RankingResponseEntry {
            user_id: entry.user_id,
            count: entry.streak,
        })
        .collect())
}

pub(crate) async fn get_ac_ranking<A>(
    state: AppData<A>,
    query: Range<usize>,
) -> Result<Vec<RankingResponseEntry>> {
    let conn = state.pg_pool.clone();
    let ranking = conn.load_accepted_count_in_range(query).await?;
    Ok(ranking
        .into_iter()
        .map(|entry| RankingResponseEntry {
            user_id: entry.user_id,
            count: entry.problem_count as i64,
        })
        .collect())
}

pub(crate) async fn get_language_ranking<A>(
    request: tide::Request<AppData<A>>,
) -> Result<tide::Response> {
    #[derive(Deserialize)]
    struct Query {
        from: usize,
        to: usize,
        language: String,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let range = (query.from)..(query.to);
    if range.len() > MAX_RANKING_RANGE_LENGTH {
        return Ok(tide::Response::new(400));
    }

    let ranking = conn
        .load_language_count_in_range(&query.language, range)
        .await?;
    let ranking = ranking
        .into_iter()
        .map(|entry| RankingResponseEntry {
            user_id: entry.user_id,
            count: entry.problem_count as i64,
        })
        .collect::<Vec<_>>();
    let response = tide::Response::json(&ranking)?;
    Ok(response)
}

pub(crate) async fn get_users_ac_rank<A>(
    state: AppData<A>,
    user_id: String,
) -> Result<Option<UserRankResponse>> {
    let conn = state.pg_pool.clone();
    let count = match conn.get_users_accepted_count(&user_id).await {
        Some(number) => number,
        None => return Ok(None),
    };
    let rank = conn.get_accepted_count_rank(count).await?;
    Ok(Some(UserRankResponse { count, rank }))
}

pub(crate) async fn get_users_streak_rank<A>(
    state: AppData<A>,
    user_id: String,
) -> Result<Option<UserRankResponse>> {
    let conn = state.pg_pool.clone();
    let count = match conn.get_users_streak_count(&user_id).await {
        Some(number) => number,
        None => return Ok(None),
    };
    let rank = conn.get_streak_count_rank(count).await?;
    Ok(Some(UserRankResponse { count, rank }))
}

pub(crate) async fn get_users_language_rank<A>(
    request: tide::Request<AppData<A>>,
) -> Result<tide::Response> {
    #[derive(Debug, Deserialize)]
    struct Query {
        user: String,
    }
    #[derive(Debug, Serialize)]
    struct UsersLanguageResponse {
        language: String,
        count: i64,
        rank: i64,
    }
    let conn = request.state().pg_pool.clone();
    let query = request.query::<Query>()?;
    let counts = conn.load_users_language_count(&query.user).await?;
    let ranks = conn.load_users_language_count_rank(&query.user).await?;
    let info = counts
        .into_iter()
        .zip(ranks)
        .map(|(c, r)| UsersLanguageResponse {
            language: c.simplified_language,
            count: c.problem_count as i64,
            rank: r.rank,
        })
        .collect::<Vec<_>>();
    let response = tide::Response::json(&info)?;
    Ok(response)
}

pub(crate) async fn get_users_rated_point_sum_rank<A>(
    state: AppData<A>,
    user_id: String,
) -> Result<Option<UserRankResponse>> {
    let conn = state.pg_pool.clone();
    let point_sum = conn.get_users_rated_point_sum(&user_id).await;
    let point_sum = match point_sum {
        Some(point_sum) => point_sum,
        None => return Ok(None),
    };

    let rank = conn.get_rated_point_sum_rank(point_sum).await?;
    let response = UserRankResponse {
        count: point_sum as i64,
        rank,
    };
    Ok(Some(response))
}
