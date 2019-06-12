use atcoder_problems_backend::sql::models::{Submission, UserProblemCount};
use atcoder_problems_backend::sql::AcceptedCountClient;

mod utils;

#[test]
fn test_accepted_count() {
    let conn = utils::connect_to_test_sql();
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
