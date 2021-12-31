use crate::server::{AppData, CommonResponse};
use actix_web::http::header::CACHE_CONTROL;
use actix_web::{error, web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};

const USER_SUBMISSION_LIMIT: usize = 500;

#[derive(Deserialize, Debug)]
pub(crate) struct GetUserSubmissionQuery {
    user: String,
    from_second: Option<i64>,
    to_second: Option<i64>,
    problems: Option<String>,
}

pub(crate) async fn get_user_submissions<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<GetUserSubmissionQuery>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let user_id = &query.user;
    let submissions = conn
        .get_submissions(SubmissionRequest::UserAll { user_id })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::Ok()
        .insert_header((CACHE_CONTROL, "max-age=300"))
        .json(&submissions)
        .make_cors();
    Ok(response)
}

pub(crate) async fn get_user_submissions_from_time<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<GetUserSubmissionQuery>,
) -> Result<HttpResponse> {
    if let GetUserSubmissionQuery {
        user: ref user_id,
        from_second: Some(from_second),
        ..
    } = *query
    {
        let conn = data.pg_pool.clone();
        let submissions = conn
            .get_submissions(SubmissionRequest::FromUserAndTime {
                user_id,
                from_second,
                count: USER_SUBMISSION_LIMIT,
            })
            .await
            .map_err(error::ErrorInternalServerError)?;
        let response = HttpResponse::json(&submissions)?.make_cors();
        Ok(response)
    } else {
        Ok(HttpResponse::BadRequest().finish())
    }
}

pub(crate) async fn get_user_submission_count<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<GetUserSubmissionQuery>,
) -> Result<HttpResponse> {
    if let GetUserSubmissionQuery {
        user: ref user_id,
        from_second: Some(from_second),
        to_second: Some(to_second),
        ..
    } = *query
    {
        let conn = data.pg_pool.clone();
        let range = from_second..to_second;
        let count = conn
            .get_user_submission_count(&user_id, range)
            .await
            .map_err(error::ErrorInternalServerError)?;

        #[derive(Serialize, Debug)]
        struct UserSubmissionCountResponse {
            count: usize,
        }
        let response = UserSubmissionCountResponse { count };
        let response = HttpResponse::json(&response)?.make_cors();
        Ok(response)
    } else {
        Ok(HttpResponse::BadRequest().finish())
    }
}

pub(crate) async fn get_recent_submissions<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let submissions = conn
        .get_submissions(SubmissionRequest::RecentAll { count: 1000 })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&submissions)?;
    Ok(response)
}

#[derive(Deserialize, Debug)]
pub(crate) struct GetUsersTimeSubmissionQuery {
    users: String,
    problems: String,
    from: i64,
    to: i64,
}

pub(crate) async fn get_users_time_submissions<A>(
    request: HttpRequest,
    data: web::Data<AppData<A>>,
    query: web::Query<GetUsersTimeSubmissionQuery>,
) -> Result<HttpResponse> {
    let conn = data.pg_pool.clone();
    let user_ids = query.users.split(',').map(|s| s.trim()).collect::<Vec<_>>();
    let problem_ids = query
        .problems
        .split(',')
        .map(|s| s.trim())
        .collect::<Vec<_>>();
    let submissions = conn
        .get_submissions(SubmissionRequest::UsersProblemsTime {
            user_ids: &user_ids,
            problem_ids: &problem_ids,
            from_second: query.from,
            to_second: query.to,
        })
        .await
        .map_err(error::ErrorInternalServerError)?;
    let response = HttpResponse::json(&submissions)?;
    Ok(response)
}
