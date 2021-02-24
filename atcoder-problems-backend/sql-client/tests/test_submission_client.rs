use sql_client::models::Submission;
use sql_client::submission_client::{SubmissionClient, SubmissionRequest};

mod utils;

#[async_std::test]
async fn test_submission_client() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
        INSERT INTO submissions
            (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result)
        VALUES
            (1, 100, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC'),
            (2, 200, 'problem1', 'contest1', 'user2', 'language1', 1.0, 1, 'AC'),
            (3, 300, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'WA'),
            (4, 400, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC'),
            (5, 1, 'problem2', 'contest1', 'userx', 'language1', 1.0, 1, '23/42 TLE'),
            (6, 2, 'problem2', 'contest1', 'userx', 'language1', 1.0, 1, '23/42 TLE');
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    let request = SubmissionRequest::UserAll { user_id: "usEr1" };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::UserAll { user_id: "user2" };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::UserAll { user_id: "user3" };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 0);

    let request = SubmissionRequest::RecentAccepted { count: 0 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 0);

    let request = SubmissionRequest::RecentAccepted { count: 1 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::RecentAccepted { count: 2 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 2);

    let request = SubmissionRequest::RecentAccepted { count: 100 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::FromTime {
        from_second: 100,
        count: 10,
    };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 4);

    let request = SubmissionRequest::FromTime {
        from_second: 200,
        count: 10,
    };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::FromTime {
        from_second: 100,
        count: 1,
    };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::UsersAccepted {
        user_ids: &["user1", "user2"],
    };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::UsersAccepted {
        user_ids: &["user1"],
    };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 2);

    pool.update_submission_count().await.unwrap();
    assert_eq!(pool.get_user_submission_count("user1").await.unwrap(), 3);
    assert_eq!(pool.get_user_submission_count("user2").await.unwrap(), 1);

    let submissions = pool
        .get_submissions(SubmissionRequest::AllAccepted)
        .await
        .unwrap();
    assert_eq!(submissions.len(), 3);

    assert_eq!(pool.count_stored_submissions(&[1]).await.unwrap(), 1);
    assert_eq!(pool.count_stored_submissions(&[9]).await.unwrap(), 0);

    let request = SubmissionRequest::InvalidResult { from_second: 1 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 2);

    let request = SubmissionRequest::InvalidResult { from_second: 2 };
    let submissions = pool.get_submissions(request).await.unwrap();
    assert_eq!(submissions.len(), 1);
}

#[async_std::test]
async fn test_update_submission_count() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
        INSERT INTO submissions
            (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result)
        VALUES
            (1, 100, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC');
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    assert!(pool.get_user_submission_count("user1").await.is_err());
    pool.update_user_submission_count("user1").await.unwrap();
    assert_eq!(pool.get_user_submission_count("user1").await.unwrap(), 1);
}

#[async_std::test]
async fn test_update_submissions() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    pool.update_submissions(&[Submission {
        id: 0,
        user_id: "old_user_name".to_owned(),
        result: "WJ".to_owned(),
        point: 0.0,
        execution_time: None,
        ..Default::default()
    }])
    .await
    .unwrap();

    let submissions = pool
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "old_user_name",
        })
        .await
        .unwrap();
    assert_eq!(submissions.len(), 1);
    assert_eq!(submissions[0].user_id, "old_user_name".to_owned());
    assert_eq!(submissions[0].result, "WJ".to_owned());
    assert_eq!(submissions[0].point, 0.0);
    assert_eq!(submissions[0].execution_time, None);

    let submissions = pool
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "new_user_name",
        })
        .await
        .unwrap();
    assert_eq!(submissions.len(), 0);

    pool.update_submissions(&[Submission {
        id: 0,
        user_id: "new_user_name".to_owned(),
        result: "AC".to_owned(),
        point: 100.0,
        execution_time: Some(1),
        ..Default::default()
    }])
    .await
    .unwrap();

    let submissions = pool
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "old_user_name",
        })
        .await
        .unwrap();
    assert_eq!(submissions.len(), 0);

    let submissions = pool
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "new_user_name",
        })
        .await
        .unwrap();
    assert_eq!(submissions.len(), 1);
    assert_eq!(submissions[0].user_id, "new_user_name".to_owned());
    assert_eq!(submissions[0].result, "AC".to_owned());
    assert_eq!(submissions[0].point, 100.0);
    assert_eq!(submissions[0].execution_time, Some(1));
}
