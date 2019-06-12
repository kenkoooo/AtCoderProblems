use atcoder_problems_backend::sql::models::ContestProblem;
use atcoder_problems_backend::sql::ContestProblemClient;

mod utils;

#[test]
fn test_contest_problem() {
    let conn = utils::connect_to_test_sql();
    assert!(conn.load_contest_problem().unwrap().is_empty());

    conn.insert_contest_problem(&vec![ContestProblem {
        contest_id: "contest1".to_string(),
        problem_id: "problem1".to_string(),
    }])
    .unwrap();
    assert_eq!(
        conn.load_contest_problem().unwrap()[0],
        ContestProblem {
            contest_id: "contest1".to_string(),
            problem_id: "problem1".to_string()
        }
    );
    conn.insert_contest_problem(&vec![ContestProblem {
        contest_id: "contest1".to_string(),
        problem_id: "problem1".to_string(),
    }])
    .unwrap();
    assert_eq!(
        conn.load_contest_problem().unwrap()[0],
        ContestProblem {
            contest_id: "contest1".to_string(),
            problem_id: "problem1".to_string()
        }
    );
}
