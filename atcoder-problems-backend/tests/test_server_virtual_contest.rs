#![allow(clippy::unwrap_used, clippy::expect_used)]

mod common;

use atcoder_problems_backend::server::GithubToken;
use axum::http::StatusCode;
use sea_orm::{ActiveValue, EntityTrait};
use serde_json::{Value, json};
use sql_entities::{
    internal_users, internal_virtual_contest_items, internal_virtual_contest_participants,
    internal_virtual_contests,
};

fn with_verify(mock: &mut common::MockGithubAuthenticator, id: i64) {
    mock.expect_verify_user()
        .returning(move |_| Ok(GithubToken { id }));
}

async fn seed_user(db: &sea_orm::DatabaseConnection, internal_id: &str, atcoder: Option<&str>) {
    internal_users::Entity::insert(internal_users::ActiveModel {
        internal_user_id: ActiveValue::Set(internal_id.into()),
        atcoder_user_id: ActiveValue::Set(atcoder.map(|s| s.to_string())),
    })
    .exec(db)
    .await
    .unwrap();
}

#[tokio::test]
async fn test_create_and_get_my_contests() {
    let db = common::setup_db().await;
    seed_user(&db, "1", Some("kenkoooo")).await;

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/create",
        json!({
            "title": "t1",
            "memo": "m1",
            "start_epoch_second": 100,
            "duration_second": 3600,
            "mode": null,
            "is_public": true,
            "penalty_second": 0
        }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    let contest_id = body["contest_id"].as_str().unwrap().to_string();

    let row = internal_virtual_contests::Entity::find_by_id(contest_id.clone())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.title.as_deref(), Some("t1"));
    assert_eq!(row.internal_user_id.as_deref(), Some("1"));
    assert!(row.is_public);

    let resp = common::get_with_cookie(&app, "/internal-api/contest/my", "token=t").await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["id"], contest_id);
}

#[tokio::test]
async fn test_update_contest() {
    let db = common::setup_db().await;
    seed_user(&db, "1", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("old".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(false),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/update",
        json!({
            "id": "c1",
            "title": "new",
            "memo": "m2",
            "start_epoch_second": 100,
            "duration_second": 300,
            "mode": "lockout",
            "is_public": true,
            "penalty_second": 300
        }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let row = internal_virtual_contests::Entity::find_by_id("c1".to_string())
        .one(&db)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(row.title.as_deref(), Some("new"));
    assert_eq!(row.mode.as_deref(), Some("lockout"));
    assert!(row.is_public);
    assert_eq!(row.penalty_second, 300);
}

#[tokio::test]
async fn test_update_items_writes_bulk() {
    let db = common::setup_db().await;
    seed_user(&db, "1", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/item/update",
        json!({
            "contest_id": "c1",
            "problems": [
                { "id": "p1", "point": 100, "order": 1 },
                { "id": "p2", "point": null, "order": 2 }
            ]
        }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    let mut items = internal_virtual_contest_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    items.sort_by_key(|i| i.user_defined_order.unwrap_or(0));
    assert_eq!(items.len(), 2);
    assert_eq!(items[0].problem_id, "p1");
    assert_eq!(items[0].user_defined_point, Some(100));
    assert_eq!(items[1].problem_id, "p2");
    assert_eq!(items[1].user_defined_point, None);
}

#[tokio::test]
async fn test_update_items_not_owner_is_forbidden() {
    let db = common::setup_db().await;
    seed_user(&db, "1", None).await;
    seed_user(&db, "2", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 2); // not the owner
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/item/update",
        json!({
            "contest_id": "c1",
            "problems": [{ "id": "p1", "point": 100, "order": 1 }]
        }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    let items = internal_virtual_contest_items::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(items.len(), 0); // nothing was written
}

#[tokio::test]
async fn test_join_leave() {
    let db = common::setup_db().await;
    seed_user(&db, "1", Some("u1")).await;
    seed_user(&db, "99", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("99".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/join",
        json!({ "contest_id": "c1" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let ps = internal_virtual_contest_participants::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(ps.len(), 1);

    let resp = common::get_with_cookie(&app, "/internal-api/contest/joined", "token=t").await;
    let body: Value = common::read_json(resp).await;
    assert_eq!(body.as_array().unwrap().len(), 1);

    let resp = common::post_json_with_cookie(
        &app,
        "/internal-api/contest/leave",
        json!({ "contest_id": "c1" }),
        "token=t",
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let ps = internal_virtual_contest_participants::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(ps.len(), 0);
}

/// Re-joining an already-joined contest still returns 200 and does not add a participant row.
#[tokio::test]
async fn test_join_contest_is_idempotent() {
    let db = common::setup_db().await;
    seed_user(&db, "1", Some("u1")).await;
    seed_user(&db, "99", None).await;
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("99".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();

    let mut mock = common::MockGithubAuthenticator::new();
    with_verify(&mut mock, 1);
    let app = common::build_app(db.clone(), mock);

    for _ in 0..2 {
        let resp = common::post_json_with_cookie(
            &app,
            "/internal-api/contest/join",
            json!({ "contest_id": "c1" }),
            "token=t",
        )
        .await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    let ps = internal_virtual_contest_participants::Entity::find()
        .all(&db)
        .await
        .unwrap();
    assert_eq!(ps.len(), 1);
}

#[tokio::test]
async fn test_get_single_contest_returns_info_problems_participants() {
    let db = common::setup_db().await;
    seed_user(&db, "1", Some("kenkoooo")).await;
    seed_user(&db, "2", Some("alice")).await;
    seed_user(&db, "3", None).await; // users without atcoder_user_id are excluded
    internal_virtual_contests::Entity::insert(internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set("c1".into()),
        title: ActiveValue::Set(Some("t".into())),
        memo: ActiveValue::Set(Some("m".into())),
        internal_user_id: ActiveValue::Set(Some("1".into())),
        start_epoch_second: ActiveValue::Set(0),
        duration_second: ActiveValue::Set(60),
        mode: ActiveValue::Set(None),
        is_public: ActiveValue::Set(true),
        penalty_second: ActiveValue::Set(0),
    })
    .exec(&db)
    .await
    .unwrap();
    internal_virtual_contest_items::Entity::insert_many(vec![
        internal_virtual_contest_items::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c1".into()),
            problem_id: ActiveValue::Set("p1".into()),
            user_defined_point: ActiveValue::Set(Some(100)),
            user_defined_order: ActiveValue::Set(Some(1)),
        },
        internal_virtual_contest_items::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c1".into()),
            problem_id: ActiveValue::Set("p2".into()),
            user_defined_point: ActiveValue::Set(None),
            user_defined_order: ActiveValue::Set(Some(2)),
        },
    ])
    .exec(&db)
    .await
    .unwrap();
    internal_virtual_contest_participants::Entity::insert_many(vec![
        internal_virtual_contest_participants::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c1".into()),
            internal_user_id: ActiveValue::Set("1".into()),
        },
        internal_virtual_contest_participants::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c1".into()),
            internal_user_id: ActiveValue::Set("2".into()),
        },
        internal_virtual_contest_participants::ActiveModel {
            internal_virtual_contest_id: ActiveValue::Set("c1".into()),
            internal_user_id: ActiveValue::Set("3".into()),
        },
    ])
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/internal-api/contest/get/c1").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Value = common::read_json(resp).await;
    assert_eq!(body["info"]["id"], "c1");
    assert_eq!(body["info"]["owner_user_id"], "1");
    assert_eq!(body["problems"].as_array().unwrap().len(), 2);
    let participants = body["participants"].as_array().unwrap();
    assert_eq!(
        participants
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect::<Vec<_>>(),
        vec!["alice", "kenkoooo"]
    );
}

#[tokio::test]
async fn test_recent_contests() {
    let db = common::setup_db().await;
    seed_user(&db, "1", None).await;
    internal_virtual_contests::Entity::insert_many(vec![
        internal_virtual_contests::ActiveModel {
            id: ActiveValue::Set("public".into()),
            title: ActiveValue::Set(Some("p".into())),
            memo: ActiveValue::Set(Some("".into())),
            internal_user_id: ActiveValue::Set(Some("1".into())),
            start_epoch_second: ActiveValue::Set(0),
            duration_second: ActiveValue::Set(60),
            mode: ActiveValue::Set(None),
            is_public: ActiveValue::Set(true),
            penalty_second: ActiveValue::Set(0),
        },
        internal_virtual_contests::ActiveModel {
            id: ActiveValue::Set("private".into()),
            title: ActiveValue::Set(Some("x".into())),
            memo: ActiveValue::Set(Some("".into())),
            internal_user_id: ActiveValue::Set(Some("1".into())),
            start_epoch_second: ActiveValue::Set(0),
            duration_second: ActiveValue::Set(60),
            mode: ActiveValue::Set(None),
            is_public: ActiveValue::Set(false),
            penalty_second: ActiveValue::Set(0),
        },
    ])
    .exec(&db)
    .await
    .unwrap();

    let app = common::build_app_no_auth(db);
    let resp = common::get(&app, "/internal-api/contest/recent").await;
    let body: Value = common::read_json(resp).await;
    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["id"], "public");
}
