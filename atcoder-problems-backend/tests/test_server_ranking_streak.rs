#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;
use sql_entities::max_streaks;

async fn seed(db: &sea_orm::DatabaseConnection) {
    max_streaks::Entity::insert_many(vec![
        max_streaks::ActiveModel {
            user_id: ActiveValue::Set("u1".into()),
            streak: ActiveValue::Set(1),
        },
        max_streaks::ActiveModel {
            user_id: ActiveValue::Set("u2".into()),
            streak: ActiveValue::Set(2),
        },
        max_streaks::ActiveModel {
            user_id: ActiveValue::Set("u3".into()),
            streak: ActiveValue::Set(1),
        },
    ])
    .exec(db)
    .await
    .unwrap();
}

#[tokio::test]
async fn test_streak_ranking() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/streak_ranking?from=0&to=10").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body[0]["user_id"], "u2");
    assert_eq!(body[0]["count"], 2);
}

#[tokio::test]
async fn test_user_streak_rank() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/streak_rank?user=u1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["count"], 1);
    assert_eq!(body["rank"], 1);
}

#[tokio::test]
async fn test_user_streak_rank_not_found() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/streak_rank?user=nobody").await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_streak_ranking_range_too_large() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/streak_ranking?from=0&to=2000").await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}
