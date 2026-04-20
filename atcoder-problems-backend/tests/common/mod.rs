#![allow(clippy::unwrap_used, clippy::expect_used, dead_code)]

use std::sync::Arc;

use async_trait::async_trait;
use atcoder_problems_backend::server::{
    AppState, AuthError, GithubAuthenticator, GithubToken, make_router,
};
use axum::{
    Router,
    body::Body,
    http::{Method, Request, Response, StatusCode},
};
use http_body_util::BodyExt;
use mockall::mock;
use sea_orm::{ConnectionTrait, Database, DatabaseConnection, DbErr, Schema};
use serde::de::DeserializeOwned;
use tower::ServiceExt;

mock! {
    pub GithubAuthenticator {}

    #[async_trait]
    impl GithubAuthenticator for GithubAuthenticator {
        async fn authorize(&self, code: &str) -> Result<String, AuthError>;
        async fn verify_user(&self, access_token: &str) -> Result<GithubToken, AuthError>;
    }
}

pub async fn setup_db() -> DatabaseConnection {
    let db = Database::connect("sqlite::memory:").await.unwrap();
    // Enable FK enforcement to match the production Postgres behaviour.
    // The `on_delete = Cascade` declared on sea-orm entities also takes effect here.
    db.execute_unprepared("PRAGMA foreign_keys = ON")
        .await
        .unwrap();
    create_all_tables(&db).await.unwrap();
    db
}

/// Shared helper that seeds a parent `internal_users` row for tests.
/// Most internal-API writes assume the corresponding `internal_user_id` row already exists,
/// so each test calls this first to insert the row representing the authenticated user.
pub async fn seed_user(
    db: &DatabaseConnection,
    internal_user_id: &str,
    atcoder_user_id: Option<&str>,
) {
    use sea_orm::{ActiveValue, EntityTrait};
    sql_entities::internal_users::Entity::insert(sql_entities::internal_users::ActiveModel {
        internal_user_id: ActiveValue::Set(internal_user_id.to_string()),
        atcoder_user_id: ActiveValue::Set(atcoder_user_id.map(|s| s.to_string())),
    })
    .exec(db)
    .await
    .unwrap();
}

async fn create_all_tables(db: &DatabaseConnection) -> Result<(), DbErr> {
    let builder = db.get_database_backend();
    let schema = Schema::new(builder);
    macro_rules! create {
        ($entity:path) => {{
            let stmt = schema.create_table_from_entity($entity);
            db.execute(builder.build(&stmt)).await?;
        }};
    }
    create!(sql_entities::accepted_count::Entity);
    create!(sql_entities::contest_problem::Entity);
    create!(sql_entities::contests::Entity);
    create!(sql_entities::fastest::Entity);
    create!(sql_entities::first::Entity);
    create!(sql_entities::internal_problem_list_items::Entity);
    create!(sql_entities::internal_problem_lists::Entity);
    create!(sql_entities::internal_progress_reset::Entity);
    create!(sql_entities::internal_users::Entity);
    create!(sql_entities::internal_virtual_contest_items::Entity);
    create!(sql_entities::internal_virtual_contest_participants::Entity);
    create!(sql_entities::internal_virtual_contests::Entity);
    create!(sql_entities::language_count::Entity);
    create!(sql_entities::max_streaks::Entity);
    create!(sql_entities::points::Entity);
    create!(sql_entities::predicted_rating::Entity);
    create!(sql_entities::problems::Entity);
    create!(sql_entities::rated_point_sum::Entity);
    create!(sql_entities::shortest::Entity);
    create!(sql_entities::solver::Entity);
    create!(sql_entities::submissions::Entity);
    Ok(())
}

pub fn build_app(db: DatabaseConnection, auth: MockGithubAuthenticator) -> Router {
    make_router(AppState::new(db, Arc::new(auth)))
}

pub fn build_app_no_auth(db: DatabaseConnection) -> Router {
    let mock = MockGithubAuthenticator::new();
    make_router(AppState::new(db, Arc::new(mock)))
}

pub async fn get(app: &Router, uri: &str) -> Response<Body> {
    app.clone()
        .oneshot(Request::get(uri).body(Body::empty()).unwrap())
        .await
        .unwrap()
}

pub async fn get_with_cookie(app: &Router, uri: &str, cookie: &str) -> Response<Body> {
    app.clone()
        .oneshot(
            Request::get(uri)
                .header("cookie", cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap()
}

pub async fn post_json(app: &Router, uri: &str, body: serde_json::Value) -> Response<Body> {
    app.clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header("content-type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap()
}

pub async fn post_json_with_cookie(
    app: &Router,
    uri: &str,
    body: serde_json::Value,
    cookie: &str,
) -> Response<Body> {
    app.clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header("content-type", "application/json")
                .header("cookie", cookie)
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap()
}

pub async fn read_json<T: DeserializeOwned>(resp: Response<Body>) -> T {
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&bytes).unwrap_or_else(|e| {
        let s = std::str::from_utf8(&bytes).unwrap_or("<invalid utf8>");
        panic!("failed to parse json: {e} (body={s})");
    })
}

pub async fn read_text(resp: Response<Body>) -> String {
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    String::from_utf8(bytes.to_vec()).unwrap()
}

pub async fn assert_status(resp: Response<Body>, expected: StatusCode) -> Response<Body> {
    assert_eq!(resp.status(), expected);
    resp
}
