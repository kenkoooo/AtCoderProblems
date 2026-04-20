#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::{StatusCode, header};
use sea_orm::EntityTrait;
use sql_entities::internal_users;

#[tokio::test]
async fn test_authorize_sets_cookie_and_registers_user() {
    let db = common::setup_db().await;

    let mut mock = common::MockGithubAuthenticator::new();
    mock.expect_authorize()
        .withf(|c| c == "abc")
        .returning(|_| Ok("access-token".to_string()));
    mock.expect_verify_user()
        .withf(|t| t == "access-token")
        .returning(|_| Ok(GithubToken { id: 42 }));

    let app = common::build_app(db.clone(), mock);
    let resp = common::get(&app, "/internal-api/authorize?code=abc").await;

    assert_eq!(resp.status(), StatusCode::FOUND);
    let location = resp.headers().get(header::LOCATION).unwrap();
    assert_eq!(location, "https://kenkoooo.com/atcoder/#/login/user");
    let set_cookie = resp
        .headers()
        .get_all(header::SET_COOKIE)
        .into_iter()
        .map(|v| v.to_str().unwrap().to_string())
        .collect::<Vec<_>>()
        .join("; ");
    assert!(set_cookie.contains("token=access-token"), "{}", set_cookie);

    let rows = internal_users::Entity::find().all(&db).await.unwrap();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].internal_user_id, "42");
}

#[tokio::test]
async fn test_authorize_with_redirect_to() {
    let db = common::setup_db().await;
    let mut mock = common::MockGithubAuthenticator::new();
    mock.expect_authorize().returning(|_| Ok("t".to_string()));
    mock.expect_verify_user()
        .returning(|_| Ok(GithubToken { id: 1 }));
    let app = common::build_app(db, mock);
    let resp = common::get(&app, "/internal-api/authorize?code=x&redirect_to=/foo/bar").await;
    assert_eq!(resp.status(), StatusCode::FOUND);
    assert_eq!(
        resp.headers().get(header::LOCATION).unwrap(),
        "https://kenkoooo.com/atcoder/#/foo/bar"
    );
}
