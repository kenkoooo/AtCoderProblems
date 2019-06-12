use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::{fastest, first, shortest, submissions};
use atcoder_problems_backend::sql::ProblemsSubmissionUpdater;
use diesel::dsl::*;
use diesel::prelude::*;

mod utils;

fn get_first(conn: &PgConnection) -> Vec<(String, String, i64)> {
    first::table
        .select((first::contest_id, first::problem_id, first::submission_id))
        .load::<(String, String, i64)>(conn)
        .unwrap()
}

fn get_shortest(conn: &PgConnection) -> Vec<(String, String, i64)> {
    shortest::table
        .select((
            shortest::contest_id,
            shortest::problem_id,
            shortest::submission_id,
        ))
        .load::<(String, String, i64)>(conn)
        .unwrap()
}

fn get_fastest(conn: &PgConnection) -> Vec<(String, String, i64)> {
    fastest::table
        .select((
            fastest::contest_id,
            fastest::problem_id,
            fastest::submission_id,
        ))
        .load::<(String, String, i64)>(conn)
        .unwrap()
}

fn insert_submissions(conn: &PgConnection, submissions: &[Submission]) {
    insert_into(submissions::table)
        .values(submissions)
        .execute(conn)
        .unwrap();
}

#[test]
fn test_problem_info_aggregator() {
    let submissions1 = vec![Submission {
        id: 1,
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        length: 20,
        execution_time: Some(10),
        ..Default::default()
    }];
    let submissions2 = vec![Submission {
        id: 2,
        problem_id: "problem1".to_owned(),
        contest_id: "contest2".to_owned(),
        length: 10,
        execution_time: Some(10),
        ..Default::default()
    }];

    {
        let conn = utils::connect_to_test_sql();

        conn.update_submissions_of_problems(&submissions1).unwrap();
        insert_submissions(&conn, &submissions1);
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);

        conn.update_submissions_of_problems(&submissions2).unwrap();
        insert_submissions(&conn, &submissions2);
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }
    {
        let conn = utils::connect_to_test_sql();

        conn.update_submissions_of_problems(&submissions2).unwrap();
        insert_submissions(&conn, &submissions2);
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions2[0].contest_id);
        assert_eq!(first[0].1, submissions2[0].problem_id);
        assert_eq!(first[0].2, submissions2[0].id);

        conn.update_submissions_of_problems(&submissions1).unwrap();
        insert_submissions(&conn, &submissions1);
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }

    {
        let conn = utils::connect_to_test_sql();
        conn.update_submissions_of_problems(&submissions1).unwrap();
        insert_submissions(&conn, &submissions1);
        let shortest = get_shortest(&conn);
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions1[0].contest_id);
        assert_eq!(shortest[0].1, submissions1[0].problem_id);
        assert_eq!(shortest[0].2, submissions1[0].id);

        conn.update_submissions_of_problems(&submissions2).unwrap();
        insert_submissions(&conn, &submissions2);
        let shortest = get_shortest(&conn);
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions2[0].contest_id);
        assert_eq!(shortest[0].1, submissions2[0].problem_id);
        assert_eq!(shortest[0].2, submissions2[0].id);
    }

    {
        let conn = utils::connect_to_test_sql();

        conn.update_submissions_of_problems(&submissions2).unwrap();
        insert_submissions(&conn, &submissions2);
        let fastest = get_fastest(&conn);
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions2[0].contest_id);
        assert_eq!(fastest[0].1, submissions2[0].problem_id);
        assert_eq!(fastest[0].2, submissions2[0].id);

        conn.update_submissions_of_problems(&submissions1).unwrap();
        insert_submissions(&conn, &submissions1);
        let fastest = get_fastest(&conn);
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions1[0].contest_id);
        assert_eq!(fastest[0].1, submissions1[0].problem_id);
        assert_eq!(fastest[0].2, submissions1[0].id);
    }
}
