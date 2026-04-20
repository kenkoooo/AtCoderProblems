#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;
use sql_entities::accepted_count;

async fn seed(db: &sea_orm::DatabaseConnection) {
    accepted_count::Entity::insert_many(vec![
        accepted_count::ActiveModel {
            user_id: ActiveValue::Set("u1".into()),
            problem_count: ActiveValue::Set(1),
        },
        accepted_count::ActiveModel {
            user_id: ActiveValue::Set("u2".into()),
            problem_count: ActiveValue::Set(2),
        },
        accepted_count::ActiveModel {
            user_id: ActiveValue::Set("u3".into()),
            problem_count: ActiveValue::Set(1),
        },
    ])
    .exec(db)
    .await
    .unwrap();
}

#[tokio::test]
async fn test_ac_ranking() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);

    let resp = common::get(&app, "/atcoder-api/v3/ac_ranking?from=0&to=10").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body[0]["user_id"], "u2");
    assert_eq!(body[0]["count"], 2);
    assert_eq!(body[1]["user_id"], "u1");
    assert_eq!(body[1]["count"], 1);
    assert_eq!(body[2]["user_id"], "u3");
    assert_eq!(body[2]["count"], 1);
}

#[tokio::test]
async fn test_ac_ranking_range_too_large() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/ac_ranking?from=0&to=2000").await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_ac_ranking_negative_from() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/ac_ranking?from=-1&to=10").await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_user_ac_rank() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);

    let resp = common::get(&app, "/atcoder-api/v3/user/ac_rank?user=U1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["count"], 1);
    assert_eq!(body["rank"], 1); // 1 user above with count > 1 (u2)
}

#[tokio::test]
async fn test_user_ac_rank_not_found() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/ac_rank?user=unknown").await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}
