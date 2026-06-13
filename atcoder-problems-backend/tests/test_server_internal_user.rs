#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::{Value, json};
use sql_entities::internal_users;

fn with_verify(mock: &mut common::MockGithubAuthenticator, id: i64) {
    mock.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
}

#[tokio::test]
async fn test_get_user_without_cookie_is_401() {
    let db = common::setup_db().await;
    let app = common::build_app(db, common::MockGithubAuthenticator::new());
    let resp = common::get(&app, "/internal-api/user/get").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_unauthorized_response_has_empty_body() {
    // The frontend's login-state fetcher calls `response.json()` unconditionally
    // and relies on it throwing to detect a logged-out user. A parseable JSON
    // error body would resolve to a truthy non-`UserResponse` object and crash
    // the UI, so the unauthorized response must keep an empty body.
    let db = common::setup_db().await;
    let app = common::build_app(db, common::MockGithubAuthenticator::new());
    let resp = common::get(&app, "/internal-api/user/get").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    let body = common::read_text(resp).await;
    assert!(body.is_empty(), "expected empty body, got: {body:?}");
}

#[tokio::test]
async fn test_get_user_returns_info() {
    let db = common::setup_db().await;
    internal_users::Entity::insert(internal_users::ActiveModel {
        internal_user_id: ActiveValue::Set("77".into()),
        atcoder_user_id: ActiveValue::Set(Some("kenkoooo".into())),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 77);
    let app = common::build_app(db, mock);

    let resp = common::get_with_cookie(&app, "/internal-api/user/get", "token=tok").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["internal_user_id"], "77");
    assert_eq!(body["atcoder_user_id"], "kenkoooo");
}

#[tokio::test]
async fn test_update_user_writes_db() {
    let db = common::setup_db().await;
    internal_users::Entity::insert(internal_users::ActiveModel {
        internal_user_id: ActiveValue::Set("99".into()),
        atcoder_user_id: ActiveValue::NotSet,
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 99);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/user/update",
        json!({ "atcoder_user_id": "newname" }),
        "token=tok",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let row = internal_users::Entity::find_by_id("99".to_string())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.atcoder_user_id.as_deref(), Some("newname"));
}
