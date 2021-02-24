use sql_client::models::{Contest, Problem};
use sql_client::simple_client::SimpleClient;

mod utils;

#[async_std::test]
async fn test_insert_contests() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    assert!(pool.load_contests().await.unwrap().is_empty());
    pool.insert_contests(&vec![Contest {
        id: "contest1".to_string(),
        start_epoch_second: 0,
        duration_second: 0,
        title: "".to_string(),
        rate_change: "".to_string(),
    }])
    .await
    .unwrap();

    let contests = pool.load_contests().await.unwrap();
    assert_eq!(contests[0].id.as_str(), "contest1");

    pool.insert_contests(&vec![Contest {
        id: "contest1".to_string(),
        start_epoch_second: 0,
        duration_second: 0,
        title: "".to_string(),
        rate_change: "".to_string(),
    }])
    .await
    .unwrap();
}

#[async_std::test]
async fn test_insert_problems() {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    assert!(pool.load_problems().await.unwrap().is_empty());
    pool.insert_problems(&vec![Problem {
        id: "problem1".to_string(),
        contest_id: "".to_string(),
        title: "".to_string(),
    }])
    .await
    .unwrap();

    let problems = pool.load_problems().await.unwrap();
    assert_eq!(problems[0].id.as_str(), "problem1");

    pool.insert_problems(&vec![Problem {
        id: "problem1".to_string(),
        contest_id: "".to_string(),
        title: "".to_string(),
    }])
    .await
    .unwrap();
}
