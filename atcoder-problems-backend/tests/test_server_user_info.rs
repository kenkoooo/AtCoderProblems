#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;

#[tokio::test]
async fn test_user_info_zero_when_no_data() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);

    let resp = common::get(&app, "/atcoder-api/v3/user_info?user=u1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["user_id"], "u1");
    assert_eq!(body["accepted_count"], 0);
    assert_eq!(body["accepted_count_rank"], 0);
    assert_eq!(body["rated_point_sum"], 0);
    assert_eq!(body["rated_point_sum_rank"], 0);
}

#[tokio::test]
async fn test_user_info_with_counts() {
    let db = common::setup_db().await;

    sql_entities::accepted_count::Entity::insert_many(vec![
        sql_entities::accepted_count::ActiveModel {
            user_id: ActiveValue::Set("u1".into()),
            problem_count: ActiveValue::Set(3),
        },
        sql_entities::accepted_count::ActiveModel {
            user_id: ActiveValue::Set("u2".into()),
            problem_count: ActiveValue::Set(5),
        },
    ])
    .exec(&db)
    .await
    .unwrap();
    sql_entities::rated_point_sum::Entity::insert_many(vec![
        sql_entities::rated_point_sum::ActiveModel {
            user_id: ActiveValue::Set("u1".into()),
            point_sum: ActiveValue::Set(100),
        },
        sql_entities::rated_point_sum::ActiveModel {
            user_id: ActiveValue::Set("u2".into()),
            point_sum: ActiveValue::Set(200),
        },
    ])
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app_no_auth(db);

    let resp = common::get(&app, "/atcoder-api/v3/user_info?user=u1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["user_id"], "u1");
    assert_eq!(body["accepted_count"], 3);
    assert_eq!(body["accepted_count_rank"], 1);
    assert_eq!(body["rated_point_sum"], 100);
    assert_eq!(body["rated_point_sum_rank"], 1);
}

#[tokio::test]
async fn test_user_info_v2_also_works() {
    let db = common::setup_db().await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v2/user_info?user=u1").await;
    assert_eq!(resp.status(), StatusCode::OK);
}
