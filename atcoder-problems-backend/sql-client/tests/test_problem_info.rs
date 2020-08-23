use sql_client::models::{Contest, Submission};
use sql_client::problem_info::ProblemInfoUpdater;
use sql_client::simple_client::SimpleClient;
use sql_client::PgPool;
use sqlx::postgres::PgRow;
use sqlx::Row;

mod utils;

async fn get_solver(pool: &PgPool) -> Vec<(String, i32)> {
    sqlx::query("SELECT problem_id, user_count FROM solver")
        .map(|row: PgRow| {
            let problem_id: String = row.get("problem_id");
            let user_count: i32 = row.get("user_count");
            (problem_id, user_count)
        })
        .fetch_all(pool)
        .await
        .unwrap()
}

async fn get_points(pool: &PgPool) -> Vec<(String, Option<f64>)> {
    sqlx::query("SELECT problem_id, point FROM points")
        .map(|row: PgRow| {
            let problem_id: String = row.get("problem_id");
            let point: Option<f64> = row.get("point");
            (problem_id, point)
        })
        .fetch_all(pool)
        .await
        .unwrap()
}

#[async_std::test]
async fn test_update_problem_solver_count() {
    let pool = utils::initialize_and_connect_to_test_sql().await;

    assert!(get_solver(&pool).await.is_empty());

    pool.update_submissions(&[
        Submission {
            id: 0,
            user_id: "user1".to_string(),
            result: "AC".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
        Submission {
            id: 1,
            user_id: "user2".to_string(),
            result: "AC".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
        Submission {
            id: 2,
            user_id: "user3".to_string(),
            result: "WA".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
    ])
    .await
    .unwrap();
    pool.update_solver_count().await.unwrap();
    assert_eq!(get_solver(&pool).await, vec![("problem".to_string(), 2)]);

    pool.update_submissions(&[Submission {
        id: 3,
        user_id: "user3".to_string(),
        result: "AC".to_string(),
        problem_id: "problem".to_string(),
        ..Default::default()
    }])
    .await
    .unwrap();
    pool.update_solver_count().await.unwrap();
    assert_eq!(get_solver(&pool).await, vec![("problem".to_string(), 3)]);
}

#[async_std::test]
async fn test_update_problem_points() {
    let contest_id = "contest";
    let problem_id = "problem";

    let pool = utils::initialize_and_connect_to_test_sql().await;
    pool.insert_contests(&[Contest {
        id: contest_id.to_string(),
        start_epoch_second: 1468670400,
        rate_change: "All".to_string(),

        duration_second: 0,
        title: "".to_string(),
    }])
    .await
    .unwrap();

    assert!(get_points(&pool).await.is_empty());

    pool.update_submissions(&[Submission {
        id: 0,
        point: 0.0,
        problem_id: problem_id.to_string(),
        contest_id: contest_id.to_string(),
        ..Default::default()
    }])
    .await
    .unwrap();
    pool.update_problem_points().await.unwrap();
    assert_eq!(
        get_points(&pool).await,
        vec![("problem".to_string(), Some(0.0))]
    );

    pool.update_submissions(&[Submission {
        id: 1,
        point: 100.0,
        problem_id: problem_id.to_string(),
        contest_id: contest_id.to_string(),
        ..Default::default()
    }])
    .await
    .unwrap();
    pool.update_problem_points().await.unwrap();
    assert_eq!(
        get_points(&pool).await,
        vec![("problem".to_string(), Some(100.0))]
    );
}
