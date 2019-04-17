mod sql_utils;

use atcoder_problems_sql_common::models::{Contest, Submission};
use atcoder_problems_sql_common::schema::*;
use atcoder_problems_sql_common::sql::SqlClient;
use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::Connection;
use sql_utils::*;
use std::collections::HashMap;

use atcoder_problems_updater_lambda::updater::*;

#[test]
fn test_update_accepted_count() {
    setup_test_db();
    let conn = connect_to_test();

    conn.insert_submissions(
        &[
            ("user1", "problem1"),
            ("user1", "problem1"),
            ("user1", "problem2"),
            ("user2", "problem1"),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, (user, problem))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: "".to_string(),
            user_id: user.to_string(),
            language: "".to_string(),
            point: 0.0,
            length: 0,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();
    conn.update_accepted_count().unwrap();

    let mut v = accepted_count::table
        .select((accepted_count::user_id, accepted_count::problem_count))
        .load::<(String, i32)>(&conn)
        .unwrap();
    v.sort_by_key(|&(_, x)| x);
    assert_eq!(v, vec![("user2".to_string(), 1), ("user1".to_string(), 2)]);
}

#[test]
fn test_update_problem_solver_count() {
    setup_test_db();
    let conn = connect_to_test();

    conn.insert_submissions(
        &[
            ("user1", "problem1"),
            ("user1", "problem1"),
            ("user1", "problem2"),
            ("user2", "problem1"),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, (user, problem))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: "".to_string(),
            user_id: user.to_string(),
            language: "".to_string(),
            point: 0.0,
            length: 0,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();
    conn.update_problem_solver_count().unwrap();

    let mut v = solver::table
        .select((solver::problem_id, solver::user_count))
        .load::<(String, i32)>(&conn)
        .unwrap();
    v.sort_by_key(|&(_, x)| x);
    assert_eq!(
        v,
        vec![("problem2".to_string(), 1), ("problem1".to_string(), 2)]
    );
}

#[test]
fn test_update_rated_point_sums() {
    setup_test_db();
    let conn = connect_to_test();

    conn.insert_submissions(
        &[
            ("user1", "problem1"),
            ("user1", "problem1"),
            ("user1", "problem2"),
            ("user1", "problem3"),
            ("user2", "problem1"),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, (user, problem))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: "".to_string(),
            user_id: user.to_string(),
            language: "".to_string(),
            point: 0.0,
            length: 0,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();

    conn.batch_execute(
        r"
        INSERT INTO points (problem_id, point) VALUES
            ('problem1', 100.0),
            ('problem2', 200.0),
            ('problem3', NULL);
        ",
    )
    .unwrap();

    conn.update_rated_point_sums().unwrap();

    let mut v = rated_point_sum::table
        .select((rated_point_sum::user_id, rated_point_sum::point_sum))
        .load::<(String, f64)>(&conn)
        .unwrap();
    v.sort_by_key(|&(_, x)| x as i64);
    assert_eq!(
        v,
        vec![("user2".to_string(), 100.0), ("user1".to_string(), 300.0),]
    );
}

#[test]
fn test_update_language_count() {
    setup_test_db();
    let conn = connect_to_test();

    conn.insert_submissions(
        &[
            ("user1", "problem1", "Perl6 (foo)"),
            ("user1", "problem1", "Perl (baa)"),
            ("user1", "problem2", "Perl"),
            ("user1", "problem3", "Java9 (aaa)"),
            ("user2", "problem1", "Java10 (aaaaa)"),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, (user, problem, language))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: "".to_string(),
            user_id: user.to_string(),
            language: language.to_string(),
            point: 0.0,
            length: 0,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();
    conn.update_language_count().unwrap();

    let mut v = language_count::table
        .select((
            language_count::user_id,
            language_count::problem_count,
            language_count::simplified_language,
        ))
        .load::<(String, i32, String)>(&conn)
        .unwrap();
    v.sort();
    assert_eq!(
        v,
        vec![
            ("user1".to_owned(), 1, "Java".to_owned()),
            ("user1".to_owned(), 1, "Perl6".to_owned()),
            ("user1".to_owned(), 2, "Perl".to_owned()),
            ("user2".to_owned(), 1, "Java".to_owned())
        ]
    );
}

#[test]
fn test_update_great_submissions() {
    setup_test_db();
    let contest_id = "contest";
    let start_epoch_second = 100;

    let conn = connect_to_test();
    conn.insert_contests(&[Contest {
        id: contest_id.to_owned(),
        start_epoch_second,
        duration_second: 0,
        title: "".to_owned(),
        rate_change: "".to_owned(),
    }])
    .unwrap();

    conn.insert_submissions(
        &[
            (1, "user1", "problem1", 90, start_epoch_second - 10),
            (2, "user2", "problem1", 110, start_epoch_second + 10),
            (3, "user3", "problem1", 100, start_epoch_second + 20),
            (4, "user4", "problem1", 100, start_epoch_second + 30),
        ]
        .into_iter()
        .map(|&(id, user, problem, length, epoch_second)| Submission {
            id,
            epoch_second,
            problem_id: problem.to_string(),
            contest_id: contest_id.to_string(),
            user_id: user.to_string(),
            language: "".to_string(),
            point: 0.0,
            length,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>(),
    )
    .unwrap();
    conn.update_great_submissions().unwrap();

    let v = shortest::table
        .select((
            shortest::contest_id,
            shortest::problem_id,
            shortest::submission_id,
        ))
        .load::<(String, String, i64)>(&conn)
        .unwrap();
    assert_eq!(v, vec![("contest".to_owned(), "problem1".to_owned(), 3)]);

    conn.aggregate_great_submissions().unwrap();
    let v = shortest_submission_count::table
        .select((
            shortest_submission_count::user_id,
            shortest_submission_count::problem_count,
        ))
        .load::<(String, i32)>(&conn)
        .unwrap();
    assert_eq!(v, vec![("user3".to_owned(), 1)]);
}

#[test]
fn test_update_problem_points() {
    setup_test_db();
    let first_agc_time = 1468670400;

    let conn = connect_to_test();
    conn.insert_contests(&[
        Contest {
            // rated contest
            title: "".to_owned(),
            id: "rated1".to_owned(),
            start_epoch_second: first_agc_time + 100,
            duration_second: 0,
            rate_change: "".to_owned(),
        },
        Contest {
            // unrated contest
            title: "".to_owned(),
            id: "unrated1".to_owned(),
            start_epoch_second: first_agc_time + 100,
            duration_second: 0,
            rate_change: "-".to_owned(),
        },
        Contest {
            // unrated contest
            title: "".to_owned(),
            id: "unrated2".to_owned(),
            start_epoch_second: 0,
            duration_second: 0,
            rate_change: "".to_owned(),
        },
    ])
    .unwrap();

    let submissions = [
        ("problem1", "rated1", 10.0),
        ("problem1", "rated1", 100.0),
        ("problem2", "rated1", 10.0),
        ("problem3", "unrated1", 10.0),
        ("problem1", "unrated2", 10.0),
    ]
    .into_iter()
    .enumerate()
    .map(|(i, &(problem, contest, point))| Submission {
        id: i as i64,
        epoch_second: 0,
        problem_id: problem.to_string(),
        contest_id: contest.to_string(),
        user_id: "".to_string(),
        language: "".to_string(),
        point,
        length: 0,
        result: "AC".to_string(),
        execution_time: Some(10),
    })
    .collect::<Vec<_>>();
    conn.insert_submissions(&submissions).unwrap();
    conn.execute(
        r"INSERT INTO points (problem_id, point, predict) 
                VALUES ('problem0', NULL, 123.4), ('problem1', 500.0, NULL);",
    )
    .unwrap();

    conn.update_problem_points().unwrap();

    let points = points::table
        .select((points::problem_id, (points::point, points::predict)))
        .load::<(String, (Option<f64>, Option<f64>))>(&conn)
        .unwrap()
        .into_iter()
        .collect::<HashMap<_, _>>();

    let mut expected = HashMap::new();
    expected.insert("problem0".to_owned(), (None, Some(123.4)));
    expected.insert("problem1".to_owned(), (Some(100.0), None));
    expected.insert("problem2".to_owned(), (Some(10.0), None));

    assert_eq!(points, expected);
}
