pub mod query;

use crate::schema::{contests, problems, submissions};
use crate::{Contest, Problem, Submission};

use diesel::dsl::insert_into;
use diesel::pg::upsert::excluded;
use diesel::pg::PgConnection;
use diesel::prelude::*;

pub trait SqlClient {
    fn insert_submissions(&self, values: &[Submission]) -> Result<usize, String>;
    fn insert_contests(&self, values: &[Contest]) -> Result<usize, String>;
    fn insert_problems(&self, values: &[Problem]) -> Result<usize, String>;
    fn get_problems(&self) -> Result<Vec<Problem>, String>;
    fn get_contests(&self) -> Result<Vec<Contest>, String>;
    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String>;
}

impl SqlClient for PgConnection {
    fn insert_submissions(&self, values: &[Submission]) -> Result<usize, String> {
        // insert_into(submissions::table)
        //     .values(values)
        //     .on_conflict(submissions::id)
        //     .do_update()
        //     .set(submissions::user_id.eq(excluded(submissions::user_id)))
        //     .execute(self)
        //     .map_err(|e| format!("{:?}", e))
        Ok(1)
    }

    fn insert_contests(&self, values: &[Contest]) -> Result<usize, String> {
        insert_into(contests::table)
            .values(values)
            .on_conflict(contests::id)
            .do_nothing()
            .execute(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn insert_problems(&self, values: &[Problem]) -> Result<usize, String> {
        insert_into(problems::table)
            .values(values)
            .on_conflict(problems::id)
            .do_nothing()
            .execute(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_problems(&self) -> Result<Vec<Problem>, String> {
        problems::dsl::problems
            .load::<Problem>(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_contests(&self) -> Result<Vec<Contest>, String> {
        contests::dsl::contests
            .load::<Contest>(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String> {
        submissions::dsl::submissions
            .filter(submissions::user_id.eq(user_id))
            .load::<Submission>(self)
            .map_err(|e| format!("{:?}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use diesel::connection::SimpleConnection;
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
        conn.insert_submissions(&v).unwrap();
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 1);

        v[0].user_id = "ooooknek".to_owned();
        conn.insert_submissions(&v).unwrap();
        println!("{:?}", conn.get_submissions("kenkoooo").unwrap());
        assert_eq!(conn.get_submissions("kenkoooo").unwrap().len(), 0);
        assert_eq!(conn.get_submissions("ooooknek").unwrap().len(), 1);
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
}
