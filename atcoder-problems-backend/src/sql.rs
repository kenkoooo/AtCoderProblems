pub mod client;
pub mod models;
pub mod schema;

pub const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
pub const UNRATED_STATE: &str = "-";

#[cfg(test)]
mod tests {
    use super::client::*;
    use super::models::*;
    use super::schema::*;
    use super::FIRST_AGC_EPOCH_SECOND;
    use diesel::connection::SimpleConnection;
    use diesel::prelude::*;
    use diesel::Connection;
    use diesel::PgConnection;
    use std::fs::File;
    use std::io::prelude::*;

    const URL: &str = "postgresql://kenkoooo:pass@localhost/test";
    const SQL_FILE_PATH: &str = "../config/database-definition.sql";

    fn read_file(path: &str) -> String {
        let mut file = File::open(path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn setup_test_db() {
        let conn = PgConnection::establish(URL).unwrap();
        let sql = read_file(SQL_FILE_PATH);
        conn.batch_execute(&sql).unwrap();
    }

    fn connect_to_test() -> PgConnection {
        PgConnection::establish(URL).expect(
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
            execution_time: None,
        }];

        let conn = connect_to_test();

        v[0].user_id = "kenkoooo".to_owned();
        v[0].result = "WJ".to_owned();
        v[0].execution_time = None;
        v[0].point = 0.0;
        conn.insert_submissions(&v).unwrap();
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 1);

        let submissions = conn.get_submissions("kenkoooo").unwrap();
        assert_eq!(submissions[0].result, "WJ".to_owned());
        assert_eq!(submissions[0].user_id, "kenkoooo".to_owned());
        assert_eq!(submissions[0].execution_time, None);
        assert_eq!(submissions[0].point, 0.0);

        v[0].user_id = "a".to_owned();
        v[0].result = "AC".to_owned();
        v[0].execution_time = Some(10);
        v[0].point = 100.0;
        conn.insert_submissions(&v).unwrap();
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 0);
        assert_eq!(conn.get_submissions("a").unwrap().len(), 1);

        let submissions = conn.get_submissions("a").unwrap();
        assert_eq!(submissions[0].result, "AC".to_owned());
        assert_eq!(submissions[0].user_id, "a".to_owned());
        assert_eq!(submissions[0].execution_time, Some(10));
        assert_eq!(submissions[0].point, 100.0);
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
    fn test_insert_performances() {
        setup_test_db();
        let conn = connect_to_test();

        let contest_id = "contest_id";

        conn.insert_contests(&[
            Contest {
                id: "too_old_contest".to_owned(),
                start_epoch_second: 0,
                duration_second: 0,
                title: "Too Old Contest".to_owned(),
                rate_change: "All".to_owned(),
            },
            Contest {
                id: "unrated_contest".to_owned(),
                start_epoch_second: FIRST_AGC_EPOCH_SECOND,
                duration_second: 0,
                title: "Unrated Contest".to_owned(),
                rate_change: "-".to_owned(),
            },
            Contest {
                id: contest_id.to_owned(),
                start_epoch_second: FIRST_AGC_EPOCH_SECOND,
                duration_second: 0,
                title: "Contest 1".to_owned(),
                rate_change: "All".to_owned(),
            },
        ])
        .unwrap();

        let contests_without_performances = conn
            .get_contests_without_performances()
            .expect("Invalid contest extraction query");

        assert_eq!(contests_without_performances, vec![contest_id.to_owned()]);

        conn.insert_performances(&[Performance {
            inner_performance: 100,
            user_id: "kenkoooo".to_owned(),
            contest_id: contest_id.to_owned(),
        }])
        .unwrap();

        let contests_without_performances = conn
            .get_contests_without_performances()
            .expect("Invalid contest extraction query");

        assert!(contests_without_performances.is_empty());
    }
}
