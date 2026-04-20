use axum::{
    extract::{Query, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use cookie::time::Duration as CookieDuration;
use serde::Deserialize;

use crate::server::{AppState, ServerError, ServerResult};
use server_db as db;

const REDIRECT_URL: &str = "https://kenkoooo.com/atcoder/";
const DEFAULT_REDIRECT_FRAGMENT: &str = "/login/user";
/// Cookie lifetime (30 days).
const COOKIE_MAX_AGE_SECS: i64 = 60 * 60 * 24 * 30;

#[derive(Deserialize)]
pub(crate) struct AuthorizeQuery {
    code: String,
    redirect_to: Option<String>,
}

/// Reject hostile `redirect_to` values (cross-host redirects, control chars, protocol injection).
/// Only allow pathnames starting with `/` and not with `//`.
fn sanitize_redirect(raw: Option<&str>) -> &str {
    let Some(s) = raw else {
        return DEFAULT_REDIRECT_FRAGMENT;
    };
    if !s.starts_with('/')
        || s.starts_with("//")
        || s.contains('\\')
        || s.chars().any(|c| c.is_control())
    {
        return DEFAULT_REDIRECT_FRAGMENT;
    }
    s
}

pub(crate) async fn get_authorize(
    State(state): State<AppState>,
    Query(q): Query<AuthorizeQuery>,
) -> ServerResult<Response> {
    let token = state.github.authorize(&q.code).await?;
    let gh = state.github.verify_user(&token).await?;
    db::internal_user::register_user(&state.db, &gh.id.to_string()).await?;

    let fragment = sanitize_redirect(q.redirect_to.as_deref());
    let location = format!("{}#{}", REDIRECT_URL, fragment);
    let location_header = HeaderValue::from_str(&location)
        .map_err(|_| ServerError::BadRequest("invalid redirect".into()))?;

    let cookie = Cookie::build(("token", token))
        .path("/")
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .max_age(CookieDuration::seconds(COOKIE_MAX_AGE_SECS))
        .build();
    let jar = CookieJar::new().add(cookie);

    let mut headers = HeaderMap::new();
    headers.insert(header::LOCATION, location_header);
    Ok((StatusCode::FOUND, jar, headers).into_response())
}
