use atcoder_problems_backend::sql;
use diesel::connection::SimpleConnection;
use diesel::Connection;
use diesel::PgConnection;
use std::fs::File;
use std::io::prelude::*;

fn connect_to_test_sql() -> PgConnection {
    let mut file = File::open("../config/database-definition.sql").unwrap();
    let mut sql = String::new();
    file.read_to_string(&mut sql).unwrap();
    let conn = PgConnection::establish("postgresql://kenkoooo:pass@localhost/test").unwrap();
    conn.batch_execute(&sql).unwrap();
    conn
}

#[test]
fn test_submission_client() {
    use sql::{SubmissionClient, SubmissionRequest};
    let conn = connect_to_test_sql();
    conn.batch_execute(
        r#"
        INSERT INTO submissions
            (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result)
        VALUES
            (1, 0, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC'),
            (2, 1, 'problem1', 'contest1', 'user2', 'language1', 1.0, 1, 'AC'),
            (3, 2, 'problem1', 'contest1', 'user1', 'language1', 1.0, 1, 'AC');
    "#,
    )
    .unwrap();

    let request = SubmissionRequest::UserAll { user_id: "user1" };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 2);

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
    assert_eq!(submissions.len(), 3);

    let request = SubmissionRequest::FromTime {
        from_second: 1,
        count: 10,
    };
    let submissions = conn.get_submissions(request).unwrap();
    assert_eq!(submissions.len(), 2);

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
}
