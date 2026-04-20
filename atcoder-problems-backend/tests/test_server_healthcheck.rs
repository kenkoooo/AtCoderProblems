#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;

#[tokio::test]
async fn test_healthcheck() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/healthcheck").await;
    assert_eq!(resp.status(), StatusCode::OK);
}
