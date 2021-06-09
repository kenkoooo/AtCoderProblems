use sql_client::models::UserStreak;
use sql_client::streak::StreakClient;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};

mod utils;

#[async_std::test]
async fn test_streak_ranking() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
        INSERT INTO submissions (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result) VALUES
        (1, 1570114800, 'problem_a', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T00:00:00+09:00
        (2, 1570150800, 'problem_b', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T10:00:00+09:00
        (3, 1570186800, 'problem_c', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T20:00:00+09:00
        (4, 1570201200, 'problem_d', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-05T00:00:00+09:00
        (5, 1570201200, 'problem_a', '', 'user2', '', 0, 0, 'AC'), -- 2019-10-05T00:00:00+09:00
        (6, 1570237200, 'problem_b', '', 'user2', '', 0, 0, 'WA'), -- 2019-10-05T10:00:00+09:00
        (7, 1570273200, 'problem_b', '', 'user2', '', 0, 0, 'AC'), -- 2019-10-05T20:00:00+09:00
        (8, 1570287600, 'problem_a', '', 'user3', '', 0, 0, 'AC'), -- 2019-10-06T00:00:00+09:00
        (9, 1570460400, 'problem_b', '', 'user3', '', 0, 0, 'AC'), -- 2019-10-08T00:00:00+09:00
        (10, 1570460400, 'problem_a', '', 'user4', '', 0, 0, 'TLE'), -- 2019-10-08T00:00:00+09:00
        (11, 1570496400, 'problem_a', '', 'user5', '', 0, 0, 'AC'); -- 2019-10-08T10:00:00+09:00
        ",
    )
    .execute(&pool)
    .await
    .unwrap();

    // update streak count
    let submissions = pool
        .get_submissions(SubmissionRequest::AllAccepted)
        .await
        .unwrap();
    pool.update_streak_count(&submissions).await.unwrap();

    // get users streak count
    assert_eq!(
        pool.get_users_streak_count("user3").await.unwrap(),
        1
    );
    assert!(
        pool
        .get_users_streak_count("non_existing_user")
        .await
        .is_none()
    );

    // get streak count rank
    assert_eq!(pool.get_streak_count_rank(2).await.unwrap(), 0);
    assert_eq!(pool.get_streak_count_rank(1).await.unwrap(), 1);
    assert_eq!(pool.get_streak_count_rank(0).await.unwrap(), 4);

    // load streak count in range
    let rank_1st_to_3rd = pool
    .load_streak_count_in_range(0..3).await.unwrap();
    assert_eq!(rank_1st_to_3rd.len(), 3);
    assert_eq!(rank_1st_to_3rd[0].user_id, "user1".to_owned());
    assert_eq!(rank_1st_to_3rd[0].streak, 2);
    assert_eq!(rank_1st_to_3rd[2].user_id, "user3".to_owned());
    assert_eq!(rank_1st_to_3rd[2].streak, 1);

    let rank_3rd_to_4th = pool
    .load_streak_count_in_range(2..4).await.unwrap();
    assert_eq!(rank_3rd_to_4th.len(), 2);
    assert_eq!(rank_3rd_to_4th[0].user_id, "user3".to_owned());
    assert_eq!(rank_3rd_to_4th[0].streak, 1);
    assert_eq!(rank_3rd_to_4th[1], UserStreak{
        user_id: "user5".to_owned(),
        streak: 1
    });

    let rank_2nd_to_2nd = pool
    .load_streak_count_in_range(1..2).await.unwrap();
    assert_eq!(rank_2nd_to_2nd.len(), 1);
    assert_eq!(rank_2nd_to_2nd[0], UserStreak{
        user_id: "user2".to_owned(),
        streak: 1
    });

}
