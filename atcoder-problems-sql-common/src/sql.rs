mod client;
mod updater;

pub use client::SqlClient;
pub use updater::SqlUpdater;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Contest, Problem, Submission};
    use crate::schema::*;
    use diesel::connection::SimpleConnection;
    use diesel::prelude::*;
    use diesel::Connection;
    use diesel::PgConnection;
    use std::fs::File;
    use std::io::prelude::*;

    const URL: &str = "postgresql://kenkoooo:pass@localhost/test";

    fn read_file(path: &str) -> String {
        let mut file = File::open(path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn setup_test_db() {
        let conn = PgConnection::establish(URL).unwrap();
        let sql = read_file("../config/database-definition.sql");
        conn.batch_execute(&sql).unwrap();
    }

    fn connect_to_test() -> PgConnection {
        PgConnection::establish("postgres://kenkoooo:pass@localhost/test").expect(
            r"
            Please prepare a database on your localhost with the following properties.
            database:   test
            username:   kenkoooo
            password:   pass
            ",
        )
    }

    #[test]
    fn test_insert_submission() {
        setup_test_db();

        let mut v = vec![Submission {
            id: 0,
            epoch_second: 0,
            problem_id: "".to_owned(),
            contest_id: "".to_owned(),
            user_id: "".to_owned(),
            language: "".to_owned(),
            point: 0.0,
            length: 0,
            result: "".to_owned(),
            execution_time: None,
        }];

        let conn = connect_to_test();
        v[0].id = 1;
        conn.insert_submissions(&v).unwrap();

        let count = submissions::dsl::submissions
            .load::<Submission>(&PgConnection::establish(&URL).unwrap())
            .unwrap()
            .into_iter()
            .count();
        assert_eq!(count, 1);

        v[0].id = 2;
        conn.insert_submissions(&v).unwrap();
        let count = submissions::dsl::submissions
            .load::<Submission>(&PgConnection::establish(&URL).unwrap())
            .unwrap()
            .into_iter()
            .count();
        assert_eq!(count, 2);
    }

    #[test]
    fn test_update_submission() {
        setup_test_db();

        let mut v = vec![Submission {
            id: 0,
            epoch_second: 0,
            problem_id: "".to_owned(),
            contest_id: "".to_owned(),
            user_id: "".to_owned(),
            language: "".to_owned(),
            point: 0.0,
            length: 0,
            result: "".to_owned(),
            execution_time: Some(10),
        }];

        let conn = connect_to_test();

        v[0].user_id = "kenkoooo".to_owned();
        v[0].result = "WJ".to_owned();
        conn.insert_submissions(&v).unwrap();
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 1);
        assert_eq!(
            conn.get_submissions("kenkoooo").unwrap()[0].result,
            "WJ".to_owned()
        );

        v[0].user_id = "a".to_owned();
        v[0].result = "AC".to_owned();
        conn.insert_submissions(&v).unwrap();
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 0);
        assert_eq!(conn.get_submissions("a").unwrap().len(), 1);
        assert_eq!(
            conn.get_submissions("a").unwrap()[0].result,
            "AC".to_owned()
        );
    }

    #[test]
    fn test_insert_problems() {
        setup_test_db();
        let conn = connect_to_test();

        assert_eq!(conn.get_problems().unwrap().len(), 0);

        let problems = vec![
            Problem {
                id: "arc001_a".to_owned(),
                contest_id: "arc001".to_owned(),
                title: "Problem 1".to_owned(),
            },
            Problem {
                id: "arc001_b".to_owned(),
                contest_id: "arc001".to_owned(),
                title: "Problem 2".to_owned(),
            },
        ];
        conn.insert_problems(&problems).unwrap();
        assert_eq!(conn.get_problems().unwrap().len(), 2);
    }

    #[test]
    fn test_insert_contests() {
        setup_test_db();
        let conn = connect_to_test();

        assert_eq!(conn.get_contests().unwrap().len(), 0);

        let contests = vec![
            Contest {
                id: "arc001".to_owned(),
                start_epoch_second: 0,
                duration_second: 0,
                title: "Contest 1".to_owned(),
                rate_change: "-".to_owned(),
            },
            Contest {
                id: "arc002".to_owned(),
                start_epoch_second: 0,
                duration_second: 0,
                title: "Contest 2".to_owned(),
                rate_change: "-".to_owned(),
            },
        ];
        conn.insert_contests(&contests).unwrap();

        assert_eq!(conn.get_contests().unwrap().len(), 2);
    }

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
                ("user1", "problem3", "Java"),
                ("user2", "problem1", "Java"),
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
            start_epoch_second: start_epoch_second,
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
                id: id,
                epoch_second: epoch_second,
                problem_id: problem.to_string(),
                contest_id: contest_id.to_string(),
                user_id: user.to_string(),
                language: "".to_string(),
                point: 0.0,
                length: length,
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
}
