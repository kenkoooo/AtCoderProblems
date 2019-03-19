use crate::{Contest, Problem, Submission};
use postgres::{Connection, TlsMode};

pub struct SqlClient {
    user: String,
    pass: String,
    host: String,
    db: String,
}

impl SqlClient {
    fn connect(&self) -> Result<Connection, String> {
        Connection::connect(
            format!(
                "postgresql://{}:{}@{}/{}",
                self.user, self.pass, self.host, self.db
            ),
            TlsMode::None,
        )
        .map_err(|e| format!("{:?}", e))
    }

    fn insert_submissions(&self, submissions: &[Submission]) -> Result<Vec<u64>, String> {
        let conn = self.connect()?;
        let query = r"
        INSERT INTO submissions (
            id,
            epoch_second,
            problem_id,
            contest_id,
            user_id,
            language,
            point,
            length,
            result,
            execution_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET user_id = $5
        ";
        submissions
            .iter()
            .map(|submission| {
                conn.execute(
                    query,
                    &[
                        &submission.id,
                        &submission.epoch_second,
                        &submission.problem_id,
                        &submission.contest_id,
                        &submission.user_id,
                        &submission.language,
                        &submission.point,
                        &submission.length,
                        &&submission.result,
                        &submission.execution_time,
                    ],
                )
                .map_err(|e| format!("{:?}", e))
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
        let conn = Connection::connect(URL, TlsMode::None).unwrap();
        let sql = read_file("../config/database-definition.sql");
        conn.batch_execute(&sql).unwrap();
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

        let conn = SqlClient {
            user: "kenkoooo".to_owned(),
            pass: "pass".to_owned(),
            host: "localhost".to_owned(),
            db: "test".to_owned(),
        };
        v[0].id = 1;
        conn.insert_submissions(&v).unwrap();

        let count = Connection::connect(URL, TlsMode::None)
            .unwrap()
            .query("SELECT id FROM submissions", &[])
            .unwrap()
            .into_iter()
            .count();
        assert_eq!(count, 1);

        v[0].id = 2;
        conn.insert_submissions(&v).unwrap();
        let count = Connection::connect(URL, TlsMode::None)
            .unwrap()
            .query("SELECT id FROM submissions", &[])
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

        let conn = SqlClient {
            user: "kenkoooo".to_owned(),
            pass: "pass".to_owned(),
            host: "localhost".to_owned(),
            db: "test".to_owned(),
        };

        v[0].user_id = "kenkoooo".to_owned();
        conn.insert_submissions(&v).unwrap();
        let user_id: String = Connection::connect(URL, TlsMode::None)
            .unwrap()
            .query("SELECT user_id FROM submissions", &[])
            .unwrap()
            .into_iter()
            .next()
            .unwrap()
            .get(0);
        assert_eq!(user_id, "kenkoooo".to_owned());

        v[0].user_id = "ooooknek".to_owned();
        conn.insert_submissions(&v).unwrap();
        let user_id: String = Connection::connect(URL, TlsMode::None)
            .unwrap()
            .query("SELECT user_id FROM submissions", &[])
            .unwrap()
            .into_iter()
            .next()
            .unwrap()
            .get(0);
        assert_eq!(user_id, "ooooknek".to_owned());
    }
}
