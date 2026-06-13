#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::StatusCode;
use sea_orm::EntityTrait;
use serde_json::{Value, json};
use sql_entities::internal_progress_reset;

fn with_verify(mock: &mut common::MockGithubAuthenticator, id: i64) {
    mock.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
}

#[tokio::test]
async fn test_add_and_list() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/progress_reset/add",
        json!({ "problem_id": "abc001_a", "reset_epoch_second": 123 }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let rows = internal_progress_reset::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].reset_epoch_second, 123);

    let resp = common::get_with_cookie(&app, "/internal-api/progress_reset/list", "token=t").await;
    let body: Value = common::read_json(resp).await;
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["problem_id"], "abc001_a");
    assert_eq!(items[0]["reset_epoch_second"], 123);
}

#[tokio::test]
async fn test_add_upserts_same_problem() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    for ts in [10, 20] {
        let resp = common::post_json_with_cookie(
            &app,
            "/internal-api/progress_reset/add",
            json!({ "problem_id": "p", "reset_epoch_second": ts }),
            "token=t",
        )
        .await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
    let rows = internal_progress_reset::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].reset_epoch_second, 20);
}

#[tokio::test]
async fn test_delete() {
    let db = common::setup_db().await;
    common::seed_user(&db, "1", None).await;
    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    common::post_json_with_cookie(
        &app,
        "/internal-api/progress_reset/add",
        json!({ "problem_id": "p1", "reset_epoch_second": 1 }),
        "token=t",
    )
    .await;

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/progress_reset/delete",
        json!({ "problem_id": "p1" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let rows = internal_progress_reset::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(rows.len(), 0);
}
