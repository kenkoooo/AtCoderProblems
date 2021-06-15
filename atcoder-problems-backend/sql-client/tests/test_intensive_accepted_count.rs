use sql_client::models::UserProblemCount;
use sql_client::intensive_accepted_count::IntensiveAcceptedCountClient;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};
use chrono::{TimeZone, Utc};

mod utils;

#[async_std::test]
async fn test_intensive_accepted_count() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
        INSERT INTO submissions (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result) VALUES 
        (1, 1570186800, 'problem_a', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T20:00:00+09:00
        (2, 1570237200, 'problem_b', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-05T10:00:00+09:00
        (3, 1570532400, 'problem_c', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-08T20:00:00+09:00
        (4, 1570726800, 'problem_d', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-11T02:00:00+09:00
        (5, 1570114799, 'problem_a', '', 'user2', '', 0, 0, 'AC'), -- 2019-10-03T23:59:59+09:00
        (6, 1570496400, 'problem_b', '', 'user2', '', 0, 0, 'AC'), -- 2019-10-08T10:00:00+09:00
        (7, 1570618800, 'problem_b', '', 'user2', '', 0, 0, 'AC'), -- 2019-10-09T20:00:00+09:00
        (8, 1568473200, 'problem_a', '', 'user3', '', 0, 0, 'AC'), -- 2019-09-15T00:00:00+09:00
        (9, 1569423600, 'problem_b', '', 'user3', '', 0, 0, 'AC'), -- 2019-09-26T00:00:00+09:00
        (10, 1570114800, 'problem_a', '', 'user4', '', 0, 0, 'AC'), -- 2019-10-04T00:00:00+09:00
        (11, 1570719600, 'problem_a', '', 'user5', '', 0, 0, 'AC'); -- 2019-10-11T10:00:00+09:00
        ",
    )
    .execute(&pool)
    .await
    .unwrap();

    // update IAC
    let submissions = pool
        .get_submissions(SubmissionRequest::AllAccepted)
        .await
        .unwrap();

    let threshold = Utc.ymd(2019, 10, 3).and_hms(15, 0, 0).timestamp(); // 2019-10-04T00:00:00+09:00
    pool.update_intensive_accepted_count(&submissions, threshold).await.unwrap();

    // get users IAC
    assert_eq!(
        pool.get_users_intensive_accepted_count("user1").await.unwrap(),
        4
    );
    assert_eq!(
        pool.get_users_intensive_accepted_count("user2").await.unwrap(),
        1
    );
    assert_eq!(
        pool.get_users_intensive_accepted_count("user4").await.unwrap(),
        1
    );
    assert!(
        pool.get_users_intensive_accepted_count("non_existing_user")
        .await
        .is_none()
    );

    // get streak count rank
    assert_eq!(pool.get_intensive_accepted_count_rank(4).await.unwrap(), 0);
    assert_eq!(pool.get_intensive_accepted_count_rank(1).await.unwrap(), 1);
    assert_eq!(pool.get_intensive_accepted_count_rank(0).await.unwrap(), 4);

    // load streak count in range
    let rank_1st_to_3rd = pool
    .load_intensive_accepted_count_in_range(0..3).await.unwrap();
    assert_eq!(rank_1st_to_3rd.len(), 3);
    assert_eq!(rank_1st_to_3rd[0].user_id, "user1".to_owned());
    assert_eq!(rank_1st_to_3rd[0].problem_count, 4);
    assert_eq!(rank_1st_to_3rd[2].user_id, "user4".to_owned());
    assert_eq!(rank_1st_to_3rd[2].problem_count, 1);

    let rank_3rd_to_8th = pool
    .load_intensive_accepted_count_in_range(2..8).await.unwrap();
    assert_eq!(rank_3rd_to_8th[1], UserProblemCount{
        user_id: "user5".to_owned(),
        problem_count: 1
    });
    assert_eq!(rank_3rd_to_8th.len(), 3);

    let rank_2nd_to_2nd = pool
    .load_intensive_accepted_count_in_range(1..2).await.unwrap();
    assert_eq!(rank_2nd_to_2nd.len(), 1);
    assert_eq!(rank_2nd_to_2nd[0], UserProblemCount{
        user_id: "user2".to_owned(),
        problem_count: 1
    });
}

