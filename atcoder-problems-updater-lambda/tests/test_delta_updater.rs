mod sql_utils;

use atcoder_problems_sql_common::models::Submission;
use atcoder_problems_sql_common::sql::SqlClient;
use sql_utils::*;

use atcoder_problems_updater_lambda::delta_updater::*;

#[test]
fn test_get_recent_submissions() {
    setup_test_db();
    let conn = connect_to_test();

    conn.insert_submissions(
        &[
            ("user1", "problem1", "WA"),
            ("user1", "problem1", "AC"),
            ("user1", "problem2", "WA"),
            ("user2", "problem1", "AC"),
            ("user1", "problem2", "WA"),
            ("user2", "problem1", "AC"),
            ("user1", "problem2", "WA"),
            ("user2", "problem1", "AC"),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, (user, problem, result))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: "".to_string(),
            user_id: user.to_string(),
            language: "".to_string(),
            point: 0.0,
            length: 0,
            result: result.to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();

    let submissions = conn.get_recent_submissions(3).unwrap();
    assert_eq!(submissions[0].id, 7);
    assert_eq!(submissions[1].id, 5);
    assert_eq!(submissions[2].id, 3);
}

#[test]
fn test_get_user_submissions() {
    setup_test_db();
    let conn = connect_to_test();
    conn.insert_submissions(
        &["user1", "user1", "user2", "user1", "user1"]
            .into_iter()
            .enumerate()
            .map(|(i, user_id)| Submission {
                id: i as i64,
                epoch_second: 0,
                problem_id: "".to_string(),
                contest_id: "".to_string(),
                user_id: user_id.to_string(),
                language: "".to_string(),
                point: 0.0,
                length: 0,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
    )
    .unwrap();

    let submissions = conn.get_recent_submissions(1).unwrap();
    assert_eq!(submissions.len(), 1);
    assert_eq!(submissions[0].user_id, "user1".to_string());

    let submissions = conn.get_user_submissions(&submissions).unwrap();
    assert_eq!(submissions.len(), 4);
    assert!(submissions
        .into_iter()
        .all(|s| s.user_id.as_str() == "user1"));
}
