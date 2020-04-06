use atcoder_problems_backend::sql::models::{Contest, Submission};
use atcoder_problems_backend::sql::schema::{points, solver};
use atcoder_problems_backend::sql::{ProblemInfoUpdater, SimpleClient, SubmissionClient};

use diesel::prelude::*;
use diesel::PgConnection;

pub mod utils;

fn get_solver(conn: &PgConnection) -> Vec<(String, i32)> {
    solver::table
        .select((solver::problem_id, solver::user_count))
        .load::<(String, i32)>(conn)
        .unwrap()
}

fn get_points(conn: &PgConnection) -> Vec<(String, Option<f64>)> {
    points::table
        .select((points::problem_id, points::point))
        .load::<(String, Option<f64>)>(conn)
        .unwrap()
}

#[test]
fn test_update_problem_solver_count() {
    let conn = utils::initialize_and_connect_to_test_sql();

    assert!(get_solver(&conn).is_empty());

    conn.update_submissions(&[
        Submission {
            id: 0,
            user_id: "user1".to_string(),
            result: "AC".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
        Submission {
            id: 1,
            user_id: "user2".to_string(),
            result: "AC".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
        Submission {
            id: 2,
            user_id: "user3".to_string(),
            result: "WA".to_string(),
            problem_id: "problem".to_string(),
            ..Default::default()
        },
    ])
    .unwrap();
    conn.update_solver_count().unwrap();
    assert_eq!(get_solver(&conn), vec![("problem".to_string(), 2)]);

    conn.update_submissions(&[Submission {
        id: 3,
        user_id: "user3".to_string(),
        result: "AC".to_string(),
        problem_id: "problem".to_string(),
        ..Default::default()
    }])
    .unwrap();
    conn.update_solver_count().unwrap();
    assert_eq!(get_solver(&conn), vec![("problem".to_string(), 3)]);
}

#[test]
fn test_update_problem_points() {
    let contest_id = "contest";
    let problem_id = "problem";

    let conn = utils::initialize_and_connect_to_test_sql();
    conn.insert_contests(&[Contest {
        id: contest_id.to_string(),
        start_epoch_second: 1468670400,
        rate_change: "All".to_string(),

        duration_second: 0,
        title: "".to_string(),
    }])
    .unwrap();

    assert!(get_points(&conn).is_empty());

    conn.update_submissions(&[Submission {
        id: 0,
        point: 0.0,
        problem_id: problem_id.to_string(),
        contest_id: contest_id.to_string(),
        ..Default::default()
    }])
    .unwrap();
    conn.update_problem_points().unwrap();
    assert_eq!(get_points(&conn), vec![("problem".to_string(), Some(0.0))]);

    conn.update_submissions(&[Submission {
        id: 1,
        point: 100.0,
        problem_id: problem_id.to_string(),
        contest_id: contest_id.to_string(),
        ..Default::default()
    }])
    .unwrap();
    conn.update_problem_points().unwrap();
    assert_eq!(
        get_points(&conn),
        vec![("problem".to_string(), Some(100.0))]
    );
}
