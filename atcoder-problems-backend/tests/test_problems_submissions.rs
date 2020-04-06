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
    use diesel::connection::SimpleConnection;

    fn setup_contests() -> PgConnection {
        let conn = utils::initialize_and_connect_to_test_sql();
        conn.batch_execute(
            r#"
                INSERT INTO contests (id, start_epoch_second, duration_second, title, rate_change) VALUES
                ('contest1', 1, 0, '', ''), ('contest2', 1, 0, '', '');
            "#,
        )
        .unwrap();
        conn
    }
    let ignored_submission = vec![Submission {
        id: 0,
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        epoch_second: 0,
        length: 1,
        execution_time: Some(1),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let submissions1 = vec![Submission {
        id: 1,
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        epoch_second: 10,
        length: 20,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let submissions2 = vec![Submission {
        id: 2,
        problem_id: "problem1".to_owned(),
        contest_id: "contest2".to_owned(),
        epoch_second: 10,
        length: 10,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];

    {
        let conn = setup_contests();

        insert_submissions(&conn, &ignored_submission);
        conn.update_submissions_of_problems().unwrap();
        let first = get_first(&conn);
        assert_eq!(first.len(), 0);

        insert_submissions(&conn, &submissions1);
        conn.update_submissions_of_problems().unwrap();
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);

        insert_submissions(&conn, &submissions2);
        conn.update_submissions_of_problems().unwrap();
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }
    {
        let conn = setup_contests();

        insert_submissions(&conn, &submissions2);
        conn.update_submissions_of_problems().unwrap();
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions2[0].contest_id);
        assert_eq!(first[0].1, submissions2[0].problem_id);
        assert_eq!(first[0].2, submissions2[0].id);

        insert_submissions(&conn, &submissions1);
        conn.update_submissions_of_problems().unwrap();
        let first = get_first(&conn);
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }

    {
        let conn = setup_contests();
        insert_submissions(&conn, &submissions1);
        conn.update_submissions_of_problems().unwrap();
        let shortest = get_shortest(&conn);
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions1[0].contest_id);
        assert_eq!(shortest[0].1, submissions1[0].problem_id);
        assert_eq!(shortest[0].2, submissions1[0].id);

        insert_submissions(&conn, &submissions2);
        conn.update_submissions_of_problems().unwrap();
        let shortest = get_shortest(&conn);
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions2[0].contest_id);
        assert_eq!(shortest[0].1, submissions2[0].problem_id);
        assert_eq!(shortest[0].2, submissions2[0].id);
    }

    {
        let conn = setup_contests();

        insert_submissions(&conn, &submissions2);
        conn.update_submissions_of_problems().unwrap();
        let fastest = get_fastest(&conn);
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions2[0].contest_id);
        assert_eq!(fastest[0].1, submissions2[0].problem_id);
        assert_eq!(fastest[0].2, submissions2[0].id);

        insert_submissions(&conn, &submissions1);
        conn.update_submissions_of_problems().unwrap();
        let fastest = get_fastest(&conn);
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions1[0].contest_id);
        assert_eq!(fastest[0].1, submissions1[0].problem_id);
        assert_eq!(fastest[0].2, submissions1[0].id);
    }
}
