#![allow(clippy::unwrap_used, clippy::expect_used)]

//! Regression tests for FK CASCADE behaviour.
//!
//! Verify that `on_delete = "Cascade"` declared on sea-orm entities is reflected in the
//! generated DDL and works as expected. If the cascade attribute is removed from an entity,
//! both production Postgres and the SQLite test backend would leak orphan rows, and these
//! tests catch that regression in either environment.

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::json;
use sql_entities::{
    internal_problem_list_items, internal_problem_lists, internal_progress_reset, internal_users,
    internal_virtual_contest_items, internal_virtual_contest_participants,
    internal_virtual_contests,
};

fn verify_as(id: i64) -> common::MockGithubAuthenticator {
    let mut m = common::MockGithubAuthenticator::new();
    m.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
    m
}

/// Deleting a list via the API should cascade-delete its items.
#[tokio::test]
async fn test_delete_list_cascades_to_items() {
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
    internal_problem_list_items::Entity::insert_many(vec![
        internal_problem_list_items::ActiveModel {
            internal_list_id: ActiveValue::Set("L".into()),
            problem_id: ActiveValue::Set("p1".into()),
            memo: ActiveValue::Set(Some("".into())),
        },
        internal_problem_list_items::ActiveModel {
            internal_list_id: ActiveValue::Set("L".into()),
            problem_id: ActiveValue::Set("p2".into()),
            memo: ActiveValue::Set(Some("".into())),
        },
    ])
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app(db.clone(), verify_as(1));
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/delete",
        json!({ "internal_list_id": "L" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let items = internal_problem_list_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(items.len(), 0, "child items should be cascade-deleted");
}

/// Deleting an `internal_users` row should cascade-delete every related list, contest,
/// progress_reset, and participant row.
#[tokio::test]
async fn test_delete_user_cascades_to_all_children() {
    let db = common::setup_db().await;
    common::seed_user(&db, "u", None).await;

    internal_problem_lists::Entity::insert(internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        internal_user_id: ActiveValue::Set(Some("u".into())),
        internal_list_name: ActiveValue::Set(Some("x".into())),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_problem_list_items::Entity::insert(internal_problem_list_items::ActiveModel {
        internal_list_id: ActiveValue::Set("L".into()),
        problem_id: ActiveValue::Set("p".into()),
        memo: ActiveValue::Set(Some("".into())),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_progress_reset::Entity::insert(internal_progress_reset::ActiveModel {
        internal_user_id: ActiveValue::Set("u".into()),
        problem_id: ActiveValue::Set("p".into()),
        reset_epoch_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("".into())),
        internal_user_id: ActiveValue::Set(Some("u".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_virtual_contest_items::Entity::insert(internal_virtual_contest_items::ActiveModel {
        internal_virtual_contest_id: ActiveValue::Set("c".into()),
        problem_id: ActiveValue::Set("p".into()),
        user_defined_point: ActiveValue::Set(None),
        user_defined_order: ActiveValue::Set(None),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_virtual_contest_participants::Entity::insert(
        internal_virtual_contest_participants::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c".into()),
            internal_user_id: ActiveValue::Set("u".into()),
        },
    )
    .exec(&db)
    .await
    .unwrap();

    internal_users::Entity::delete_by_id("u".to_string())
        .exec(&db)
        .await
        .unwrap();

    assert_eq!(
        internal_problem_lists::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
    assert_eq!(
        internal_problem_list_items::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
    assert_eq!(
        internal_progress_reset::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
    assert_eq!(
        internal_virtual_contests::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
    assert_eq!(
        internal_virtual_contest_items::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
    assert_eq!(
        internal_virtual_contest_participants::Entity::find()
            .all(&db)
            .await
            .unwrap()
            .len(),
        0
    );
}

/// With FKs enabled, creating a list with no parent user must fail rather than
/// silently inserting an orphan row. We accept any error status here rather
/// than pinning the specific code, so that adding an explicit up-front
/// existence check (turning the DbErr into a 400/404) will not silently break
/// this test.
#[tokio::test]
async fn test_list_create_without_parent_user_errors() {
    let db = common::setup_db().await;
    // intentionally leave internal_users empty
    let app = common::build_app(db, verify_as(12345));
    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/list/create",
        json!({ "list_name": "x" }),
        "token=t",
    )
    .await;
    assert!(
        resp.status().is_client_error() || resp.status().is_server_error(),
        "expected an error status, got {}",
        resp.status()
    );
}
