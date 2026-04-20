#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::Value;
use sql_entities::language_count;

async fn seed(db: &sea_orm::DatabaseConnection) {
    let rows = [
        ("user1", "lang1", 1),
        ("user1", "lang2", 1),
        ("user1", "lang3", 3),
        ("user2", "lang1", 3),
        ("user2", "lang2", 2),
        ("user3", "lang1", 2),
        ("user3", "lang2", 2),
    ];
    let ams: Vec<_> = rows
        .iter()
        .map(|(u, l, c)| language_count::ActiveModel {
            user_id: ActiveValue::Set((*u).into()),
            simplified_language: ActiveValue::Set((*l).into()),
            problem_count: ActiveValue::Set(*c),
        })
        .collect();
    language_count::Entity::insert_many(ams)
        .exec(db)
        .await
        .unwrap();
}

#[tokio::test]
async fn test_language_ranking() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(
        &app,
        "/atcoder-api/v3/language_ranking?from=0&to=5&language=lang1",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 3);
    assert_eq!(arr[0]["user_id"], "user2");
    assert_eq!(arr[0]["count"], 3);
    assert_eq!(arr[1]["user_id"], "user3");
    assert_eq!(arr[1]["count"], 2);
    assert_eq!(arr[2]["user_id"], "user1");
    assert_eq!(arr[2]["count"], 1);
}

#[tokio::test]
async fn test_language_list() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/language_list").await;
    let body: Vec<String> = common::read_json(resp).await;
    assert_eq!(body, vec!["lang1", "lang2", "lang3"]);
}

#[tokio::test]
async fn test_user_language_rank() {
    let db = common::setup_db().await;
    seed(&db).await;
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/atcoder-api/v3/user/language_rank?user=user1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    // lang1: 2 users beat user1's count=1 (user2=3, user3=2) -> rank=3
    // lang2: 2 users beat user1's count=1 (user2=2, user3=2) -> rank=3
    // lang3: only user1 (count=3), nobody above -> rank=1
    let lang_map: std::collections::HashMap<_, _> = arr
        .iter()
        .map(|e| {
            (
                e["language"].as_str().unwrap().to_string(),
                (e["count"].as_i64().unwrap(), e["rank"].as_i64().unwrap()),
            )
        })
        .collect();
    assert_eq!(lang_map["lang1"], (1, 3));
    assert_eq!(lang_map["lang2"], (1, 3));
    assert_eq!(lang_map["lang3"], (3, 1));
}
