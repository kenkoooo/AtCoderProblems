#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;
use sql_entities::submissions;

async fn seed(db: &sea_orm::DatabaseConnection) {
    let rows = [
        (1, 0, "p1", "c1", "u1", "WA"),
        (2, 1, "p1", "c1", "u1", "AC"),
        (3, 2, "p1", "c1", "u2", "AC"),
        (4, 3, "p2", "c1", "u1", "AC"),
        (5, 150, "p1", "c1", "u2", "AC"),
    ];
    let ams: Vec<_> = rows
        .iter()
        .map(|(id, t, p, c, u, r)| submissions::ActiveModel {
            id: ActiveValue::Set(*id),
            epoch_second: ActiveValue::Set(*t),
            problem_id: ActiveValue::Set((*p).into()),
            contest_id: ActiveValue::Set((*c).into()),
            user_id: ActiveValue::Set((*u).into()),
            language: ActiveValue::Set("Rust".into()),
            point: ActiveValue::Set(0.0),
            length: ActiveValue::Set(0),
            result: ActiveValue::Set((*r).into()),
            execution_time: ActiveValue::Set(None),
        })
        .collect();
    submissions::Entity::insert_many(ams)
        .exec(db)
        .await
        .unwrap();
}

#[tokio::test]
async fn test_user_submissions_from_time() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/user/submissions?user=U1&from_second=3",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["id"], 4);
}

#[tokio::test]
async fn test_user_submissions_missing_from_second_is_400() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/submissions?user=u1").await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_from_time_negative_is_400() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/from/-1").await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_from_time() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/from/100").await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["id"], 5);
}

#[tokio::test]
async fn test_recent() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/recent").await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 5);
    assert_eq!(arr[0]["id"], 5); // id descending
}

#[tokio::test]
async fn test_submission_count() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/user/submission_count?user=u1&from_second=1&to_second=4",
    )
    .await;
    let body: Value = common::read_json(resp).await;
    // from=1 (inclusive), to=4 (exclusive) -> u1 ids 2, 4 (epoch 1, 3) qualify.
    assert_eq!(body["count"], 2);
}

#[tokio::test]
async fn test_users_and_time_empty_list_returns_empty() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/users_and_time?users=&problems=p1&from=0&to=100",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_users_and_time_from_greater_than_to_is_400() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/users_and_time?users=u1&problems=p1&from=100&to=0",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_users_and_time() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/users_and_time?users=u1,u2&problems=p1&from=0&to=200",
    )
    .await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    // p1 AND (u1, u2) AND 0 <= epoch <= 200: ids 1, 2, 3, 5 -> 4 rows.
    assert_eq!(arr.len(), 4);
}
