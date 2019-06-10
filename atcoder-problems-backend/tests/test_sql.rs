use atcoder_problems_backend::sql;

use atcoder_problems_backend::sql::models::Submission;
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

    assert_eq!(conn.get_user_submission_count("user1").unwrap(), 3);
    assert_eq!(conn.get_user_submission_count("user2").unwrap(), 1);

    let submissions = conn
        .get_submissions(SubmissionRequest::AllAccepted)
        .unwrap();
    assert_eq!(submissions.len(), 3);
}

#[test]
fn test_language_count() {
    use sql::models::UserLanguageCount;
    use sql::LanguageCountClient;
    let conn = connect_to_test_sql();
    let submissions = [
        Submission {
            id: 1,
            problem_id: "problem1".to_owned(),
            user_id: "user1".to_owned(),
            language: "language1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 2,
            problem_id: "problem2".to_owned(),
            user_id: "user1".to_owned(),
            language: "language1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 3,
            problem_id: "problem1".to_owned(),
            user_id: "user1".to_owned(),
            language: "language1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 4,
            problem_id: "problem1".to_owned(),
            user_id: "user1".to_owned(),
            language: "language2".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 5,
            problem_id: "problem1".to_owned(),
            user_id: "user2".to_owned(),
            language: "language1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 6,
            problem_id: "problem1".to_owned(),
            user_id: "user3".to_owned(),
            language: "Perl (5)".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 7,
            problem_id: "problem1".to_owned(),
            user_id: "user3".to_owned(),
            language: "Perl6".to_owned(),
            ..Default::default()
        },
    ];
    conn.update_language_count(&submissions).unwrap();
    let language_count = conn.load_language_count().unwrap();
    assert_eq!(
        language_count,
        vec![
            UserLanguageCount {
                user_id: "user1".to_owned(),
                simplified_language: "language1".to_owned(),
                problem_count: 2
            },
            UserLanguageCount {
                user_id: "user1".to_owned(),
                simplified_language: "language2".to_owned(),
                problem_count: 1
            },
            UserLanguageCount {
                user_id: "user2".to_owned(),
                simplified_language: "language1".to_owned(),
                problem_count: 1
            },
            UserLanguageCount {
                user_id: "user3".to_owned(),
                simplified_language: "Perl".to_owned(),
                problem_count: 1
            },
            UserLanguageCount {
                user_id: "user3".to_owned(),
                simplified_language: "Perl6".to_owned(),
                problem_count: 1
            }
        ]
    );
}

#[test]
fn test_accepted_count() {
    use sql::models::UserProblemCount;
    use sql::AcceptedCountClient;
    let conn = connect_to_test_sql();
    let submissions = [
        Submission {
            id: 1,
            user_id: "user1".to_owned(),
            problem_id: "problem1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 2,
            user_id: "user1".to_owned(),
            problem_id: "problem1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 3,
            user_id: "user1".to_owned(),
            problem_id: "problem2".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 4,
            user_id: "user2".to_owned(),
            problem_id: "problem1".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 5,
            user_id: "user2".to_owned(),
            problem_id: "problem2".to_owned(),
            ..Default::default()
        },
        Submission {
            id: 6,
            user_id: "user2".to_owned(),
            problem_id: "problem3".to_owned(),
            ..Default::default()
        },
    ];
    conn.update_accepted_count(&submissions).unwrap();

    let accepted_count = conn.load_accepted_count().unwrap();
    assert_eq!(
        accepted_count,
        vec![
            UserProblemCount {
                user_id: "user2".to_owned(),
                problem_count: 3
            },
            UserProblemCount {
                user_id: "user1".to_owned(),
                problem_count: 2
            }
        ]
    );

    assert_eq!(conn.get_users_accepted_count("user1").unwrap(), 2);
    assert_eq!(conn.get_users_accepted_count("user2").unwrap(), 3);
    assert_eq!(conn.get_accepted_count_rank(3).unwrap(), 0);
    assert_eq!(conn.get_accepted_count_rank(2).unwrap(), 1);
}
