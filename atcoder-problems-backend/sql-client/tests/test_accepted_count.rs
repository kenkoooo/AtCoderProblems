use sql_client::accepted_count::AcceptedCountClient;
use sql_client::models::{Submission, UserProblemCount};

mod utils;

#[async_std::test]
async fn test_accepted_count() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
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
    pool.update_accepted_count(&submissions).await.unwrap();

    let accepted_count = pool.load_accepted_count().await.unwrap();
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

    assert_eq!(pool.get_users_accepted_count("user1").await.unwrap(), 2);
    assert_eq!(pool.get_users_accepted_count("user2").await.unwrap(), 3);
    assert_eq!(pool.get_accepted_count_rank(3).await.unwrap(), 0);
    assert_eq!(pool.get_accepted_count_rank(2).await.unwrap(), 1);

    assert!(pool
        .get_users_accepted_count("non_existing_user")
        .await
        .is_none());
}
