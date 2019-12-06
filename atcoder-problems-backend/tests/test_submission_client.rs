use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::{SubmissionClient, SubmissionRequest};
use diesel::connection::SimpleConnection;
pub mod utils;

#[test]
fn test_submission_client() {
    let conn = utils::connect_to_test_sql();
    conn.batch_execute(
        r#"
        INSERT INTO submissions
            (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result)
        VALUES
            (1, 0, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC'),
            (2, 1, 'problem1', 'contest1', 'user2', 'language1', 1.0, 1, 'AC'),
            (3, 2, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'WA'),
            (4, 3, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC');
    "#,
    )
    .unwrap();

    let request = SubmissionRequest::UserAll { user_id: "user1" };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::UserAll { user_id: "user2" };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::UserAll { user_id: "user3" };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 0);

    let request = SubmissionRequest::RecentAccepted { count: 0 };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 0);

    let request = SubmissionRequest::RecentAccepted { count: 1 };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::RecentAccepted { count: 2 };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 2);

    let request = SubmissionRequest::RecentAccepted { count: 100 };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::FromTime {
        from_second: 0,
        count: 10,
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 4);

    let request = SubmissionRequest::FromTime {
        from_second: 1,
        count: 10,
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::FromTime {
        from_second: 1,
        count: 1,
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 1);

    let request = SubmissionRequest::UsersAccepted {
        user_ids: &["user1", "user2"],
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::UsersAccepted {
        user_ids: &["user1"],
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 2);

    conn.update_submission_count().unwrap();
    assert_eq!(conn.get_user_submission_count("user1").unwrap(), 3);
    assert_eq!(conn.get_user_submission_count("user2").unwrap(), 1);

    let submissions = conn
        .get_submissions(SubmissionRequest::AllAccepted)
        .unwrap();
    assert_eq!(submissions.len(), 3);

    assert!(conn.get_submission_by_id(1).unwrap().is_some());
    assert!(conn.get_submission_by_id(9).unwrap().is_none());
}

#[test]
fn test_update_submissions() {
    let conn = utils::connect_to_test_sql();
    conn.update_submissions(&[Submission {
        id: 0,
        user_id: "old_user_name".to_owned(),
        result: "WJ".to_owned(),
        point: 0.0,
        execution_time: None,
        ..Default::default()
    }])
    .unwrap();

    let submissions = conn
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "old_user_name",
        })
        .unwrap();
    assert_eq!(submissions.len(), 1);
    assert_eq!(submissions[0].user_id, "old_user_name".to_owned());
    assert_eq!(submissions[0].result, "WJ".to_owned());
    assert_eq!(submissions[0].point, 0.0);
    assert_eq!(submissions[0].execution_time, None);

    let submissions = conn
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "new_user_name",
        })
        .unwrap();
    assert_eq!(submissions.len(), 0);

    conn.update_submissions(&[Submission {
        id: 0,
        user_id: "new_user_name".to_owned(),
        result: "AC".to_owned(),
        point: 100.0,
        execution_time: Some(1),
        ..Default::default()
    }])
    .unwrap();

    let submissions = conn
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "old_user_name",
        })
        .unwrap();
    assert_eq!(submissions.len(), 0);

    let submissions = conn
        .get_submissions(SubmissionRequest::UserAll {
            user_id: "new_user_name",
        })
        .unwrap();
    assert_eq!(submissions.len(), 1);
    assert_eq!(submissions[0].user_id, "new_user_name".to_owned());
    assert_eq!(submissions[0].result, "AC".to_owned());
    assert_eq!(submissions[0].point, 100.0);
    assert_eq!(submissions[0].execution_time, Some(1));
}
