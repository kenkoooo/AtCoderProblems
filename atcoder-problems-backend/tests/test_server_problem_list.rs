#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::{Value, json};
use sql_entities::{internal_problem_list_items, internal_problem_lists};

fn with_verify(mock: &mut common::MockGithubAuthenticator, id: i64) {
    mock.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
}

#[tokio::test]
async fn test_create_and_get_my_list() {
    let db = common::setup_db().await;
    common::seed_user(&db, "7", None).await;
    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 7);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/create",
        json!({ "list_name": "my problems" }),
        "token=tok",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    let list_id = body["internal_list_id"].as_str().unwrap().to_string();

    let row = internal_problem_lists::Entity::find_by_id(list_id.clone())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.internal_user_id.as_deref(), Some("7"));
    assert_eq!(row.internal_list_name.as_deref(), Some("my problems"));

    let resp = common::get_with_cookie(&app, "/internal-api/list/my", "token=tok").await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["internal_list_id"], list_id);
    assert_eq!(arr[0]["internal_list_name"], "my problems");
}

#[tokio::test]
async fn test_public_get_single_list_without_auth() {
    let db = common::setup_db().await;
    common::seed_user(&db, "9", None).await;
    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("list1".into()),
        internal_user_id: ActiveValue::Set(Some("9".into())),
        internal_list_name: ActiveValue::Set(Some("public".into())),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_problem_list_items::Entity::insert(internal_problem_list_items::ActiveModel {
        internal_list_id: ActiveValue::Set("list1".into()),
        problem_id: ActiveValue::Set("abc001_a".into()),
        memo: ActiveValue::Set(Some("hello".into())),
    })
    .exec(&db)
    .await
    .unwrap();
    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/internal-api/list/get/list1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["internal_list_name"], "public");
    assert_eq!(body["items"][0]["problem_id"], "abc001_a");
    assert_eq!(body["items"][0]["memo"], "hello");
}

#[tokio::test]
async fn test_update_list() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        internal_list_name: ActiveValue::Set(Some("old".into())),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/update",
        json!({ "internal_list_id": "L", "name": "new" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let row = internal_problem_lists::Entity::find_by_id("L".to_string())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.internal_list_name.as_deref(), Some("new"));
}

#[tokio::test]
async fn test_delete_list() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        internal_list_name: ActiveValue::Set(Some("x".into())),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/delete",
        json!({ "internal_list_id": "L" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let count = internal_problem_lists::Entity::find()
        .all(&db)
        .await
        .unwrap()
        .len();
    assert_eq!(count, 0);
}

#[tokio::test]
async fn test_add_update_delete_item() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        internal_list_name: ActiveValue::Set(Some("x".into())),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    // add
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/item/add",
        json!({ "internal_list_id": "L", "problem_id": "abc001_a" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let items = internal_problem_list_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(items.len(), 1);

    // update memo
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/item/update",
        json!({ "internal_list_id": "L", "problem_id": "abc001_a", "memo": "review" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let items = internal_problem_list_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(items[0].memo.as_deref(), Some("review"));

    // delete
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/item/delete",
        json!({ "internal_list_id": "L", "problem_id": "abc001_a" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let items = internal_problem_list_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(items.len(), 0);
}
