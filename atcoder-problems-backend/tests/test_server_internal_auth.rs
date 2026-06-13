#![allow(clippy::unwrap_used, clippy::expect_used)]

//! Authentication / authorization error-path tests for the internal API.
//!
//! - No cookie -> 401
//! - Cookie present but verify fails -> 401
//! - Non-owner write -> 403 (404 if the target id does not exist)

mod common;

use atcoder_problems_backend::server::{AuthError, GithubToken};
use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::json;
use sql_entities::{internal_problem_lists, internal_virtual_contests};

/// Mock that always fails `verify_user`.
fn mock_verify_failing() -> common::MockGithubAuthenticator {
    let mut m = common::MockGithubAuthenticator::new();
    m.expect_verify_user()
        .returning(|_| Err(AuthError::InvalidResponse));
    m
}

fn mock_verify_as(id: i64) -> common::MockGithubAuthenticator {
    let mut m = common::MockGithubAuthenticator::new();
    m.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
    m
}

/// Every authenticated GET/POST endpoint must return 401 when no cookie is sent.
#[tokio::test]
async fn test_all_authed_endpoints_require_cookie() {
    let db = common::setup_db().await;
    let app = common::build_app(db, common::MockGithubAuthenticator::new());

    let get_endpoints = [
        "/internal-api/user/get",
        "/internal-api/list/my",
        "/internal-api/contest/my",
        "/internal-api/contest/joined",
        "/internal-api/progress_reset/list",
    ];
    for ep in get_endpoints {
        let resp = common::get(&app, ep).await;
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "GET {ep}");
    }

    let post_endpoints = [
        (
            "/internal-api/user/update",
            json!({ "atcoder_user_id": "x" }),
        ),
        ("/internal-api/list/create", json!({ "list_name": "x" })),
        (
            "/internal-api/list/update",
            json!({ "internal_list_id": "L", "name": "x" }),
        ),
        (
            "/internal-api/list/delete",
            json!({ "internal_list_id": "L" }),
        ),
        (
            "/internal-api/list/item/add",
            json!({ "internal_list_id": "L", "problem_id": "p" }),
        ),
        (
            "/internal-api/list/item/update",
            json!({ "internal_list_id": "L", "problem_id": "p", "memo": "m" }),
        ),
        (
            "/internal-api/list/item/delete",
            json!({ "internal_list_id": "L", "problem_id": "p" }),
        ),
        (
            "/internal-api/contest/create",
            json!({
                "title": "t", "memo": "m", "start_epoch_second": 0,
                "duration_second": 60, "mode": null, "is_public": true, "penalty_second": 0
            }),
        ),
        (
            "/internal-api/contest/update",
            json!({
                "id": "c", "title": "t", "memo": "m", "start_epoch_second": 0,
                "duration_second": 60, "mode": null, "is_public": true, "penalty_second": 0
            }),
        ),
        (
            "/internal-api/contest/item/update",
            json!({ "contest_id": "c", "problems": [] }),
        ),
        ("/internal-api/contest/join", json!({ "contest_id": "c" })),
        ("/internal-api/contest/leave", json!({ "contest_id": "c" })),
        (
            "/internal-api/progress_reset/add",
            json!({ "problem_id": "p", "reset_epoch_second": 0 }),
        ),
        (
            "/internal-api/progress_reset/delete",
            json!({ "problem_id": "p" }),
        ),
    ];
    for (ep, body) in post_endpoints {
        let resp = common::post_json(&app, ep, body).await;
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED, "POST {ep}");
    }
}

/// A cookie present but failing verification must also produce 401.
#[tokio::test]
async fn test_authed_endpoint_rejects_invalid_token() {
    let db = common::setup_db().await;
    let app = common::build_app(db, mock_verify_failing());

    let resp = common::get_with_cookie(&app, "/internal-api/user/get", "token=bad").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/progress_reset/add",
        json!({ "problem_id": "p", "reset_epoch_second": 0 }),
        "token=bad",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

/// Public GET endpoints (no auth required) work without a cookie.
#[tokio::test]
async fn test_public_get_endpoints_do_not_require_auth() {
    let db = common::setup_db().await;
    let app = common::build_app(db, common::MockGithubAuthenticator::new());

    // list/get/{id} returns 404 for a missing list, not 401.
    let resp = common::get(&app, "/internal-api/list/get/nonexistent").await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    // Same for contest/get/{id}.
    let resp = common::get(&app, "/internal-api/contest/get/nonexistent").await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    // contest/recent returns 200 with an empty array.
    let resp = common::get(&app, "/internal-api/contest/recent").await;
    assert_eq!(resp.status(), StatusCode::OK);
}

/// A non-owner calling list/update gets 403 and the DB row is unchanged.
#[tokio::test]
async fn test_list_update_by_non_owner_is_forbidden() {
    let db = common::setup_db().await;
    common::seed_user(&db, "owner", None).await;
    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        internal_user_id: ActiveValue::Set(Some("owner".into())),
        internal_list_name: ActiveValue::Set(Some("old".into())),
    })
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app(db.clone(), mock_verify_as(9999));
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/update",
        json!({ "internal_list_id": "L", "name": "hijacked" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    let row = internal_problem_lists::Entity::find_by_id("L".to_string())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.internal_list_name.as_deref(), Some("old"));
}

/// Mutating endpoints targeting a non-existent list return 404.
#[tokio::test]
async fn test_list_update_on_missing_list_is_not_found() {
    let db = common::setup_db().await;
    let app = common::build_app(db, mock_verify_as(1));
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/update",
        json!({ "internal_list_id": "nonexistent", "name": "x" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

/// A non-owner calling contest/update gets 403.
#[tokio::test]
async fn test_contest_update_by_non_owner_is_forbidden() {
    let db = common::setup_db().await;
    common::seed_user(&db, "owner", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("old".into())),
        memo: ActiveValue::Set(Some("".into())),
        internal_user_id: ActiveValue::Set(Some("owner".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(false),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app(db.clone(), mock_verify_as(9999));
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/update",
        json!({
            "id": "c1", "title": "hijacked", "memo": "",
            "start_epoch_second": 0, "duration_second": 60,
            "mode": null, "is_public": true, "penalty_second": 0
        }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    let row = internal_virtual_contests::Entity::find_by_id("c1".to_string())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.title.as_deref(), Some("old"));
}
