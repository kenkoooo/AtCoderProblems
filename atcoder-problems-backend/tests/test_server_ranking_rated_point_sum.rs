#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;
use sql_entities::rated_point_sum;

async fn seed(db: &sea_orm::DatabaseConnection) {
    rated_point_sum::Entity::insert_many(vec![
        rated_point_sum::ActiveModel {
            user_id: ActiveValue::Set("u1".into()),
            point_sum: ActiveValue::Set(1),
        },
        rated_point_sum::ActiveModel {
            user_id: ActiveValue::Set("u2".into()),
            point_sum: ActiveValue::Set(2),
        },
        rated_point_sum::ActiveModel {
            user_id: ActiveValue::Set("u3".into()),
            point_sum: ActiveValue::Set(1),
        },
    ])
    .exec(db)
    .await
    .unwrap();
}

#[tokio::test]
async fn test_rated_point_sum_ranking() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/rated_point_sum_ranking?from=0&to=3").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body.as_array().unwrap().len(), 3);
    assert_eq!(body[0]["user_id"], "u2");
    assert_eq!(body[0]["count"], 2);
}

#[tokio::test]
async fn test_user_rated_point_sum_rank() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/rated_point_sum_rank?user=U2").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["count"], 2);
    assert_eq!(body["rank"], 0);
}

#[tokio::test]
async fn test_user_rated_point_sum_rank_not_found() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/user/rated_point_sum_rank?user=nobody",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}
