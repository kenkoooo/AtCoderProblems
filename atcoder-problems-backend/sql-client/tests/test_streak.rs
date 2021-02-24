use sql_client::models::UserStreak;
use sql_client::streak::StreakUpdater;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use sqlx::postgres::PgRow;
use sqlx::Row;

mod utils;

#[async_std::test]
async fn test_update_streak_ranking() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
    INSERT INTO submissions (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result) VALUES 
    (1, 1570114800, 'problem_a', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T00:00:00+09:00
    (2, 1570150800, 'problem_b', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T10:00:00+09:00
    (3, 1570186800, 'problem_c', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T20:00:00+09:00
    (4, 1570201200, 'problem_d', '', 'user1', '', 0, 0, 'AC'); -- 2019-10-05T00:00:00+09:00
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    let submissions = pool
        .get_submissions(SubmissionRequest::AllAccepted)
        .await
        .unwrap();
    pool.update_streak_count(&submissions).await.unwrap();

    let v = sqlx::query("SELECT user_id, streak FROM max_streaks")
        .map(|row: PgRow| {
            let user_id: String = row.get("user_id");
            let streak: i64 = row.get("streak");
            UserStreak { user_id, streak }
        })
        .fetch_all(&pool)
        .await
        .unwrap();

    assert_eq!(v.len(), 1);
    assert_eq!(v[0].streak, 2);
}

