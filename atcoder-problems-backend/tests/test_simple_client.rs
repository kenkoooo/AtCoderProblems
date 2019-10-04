use atcoder_problems_backend::sql::models::{Contest, Problem};
use atcoder_problems_backend::sql::SimpleClient;

mod utils;

#[test]
fn test_insert_contests() {
    let conn = utils::connect_to_test_sql();
    assert!(conn.load_contests().unwrap().is_empty());
    conn.insert_contests(&vec![Contest {
        id: "contest1".to_string(),
        start_epoch_second: 0,
        duration_second: 0,
        title: "".to_string(),
        rate_change: "".to_string(),
    }])
    .unwrap();

    let contests = conn.load_contests().unwrap();
    assert_eq!(contests[0].id.as_str(), "contest1");

    conn.insert_contests(&vec![Contest {
        id: "contest1".to_string(),
        start_epoch_second: 0,
        duration_second: 0,
        title: "".to_string(),
        rate_change: "".to_string(),
    }])
    .unwrap();
}

#[test]
fn test_insert_problems() {
    let conn = utils::connect_to_test_sql();
    assert!(conn.load_problems().unwrap().is_empty());
    conn.insert_problems(&vec![Problem {
        id: "problem1".to_string(),
        contest_id: "".to_string(),
        title: "".to_string(),
    }])
    .unwrap();

    let problems = conn.load_problems().unwrap();
    assert_eq!(problems[0].id.as_str(), "problem1");

    conn.insert_problems(&vec![Problem {
        id: "problem1".to_string(),
        contest_id: "".to_string(),
        title: "".to_string(),
    }])
    .unwrap();
}
