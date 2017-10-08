use mysql;
use mysql::Pool;
use scraper::Submission;

pub struct SqlConnection {
    pool: Pool,
}


pub fn connect(uri: &str) -> Pool {
    match Pool::new(uri) {
        Err(_) => panic!("the connection to MySQL cannot be established."),
        Ok(p) => p
    }
}

impl SqlConnection {
    pub fn new(uri: &str) -> Self {
        SqlConnection {
            pool: connect(uri),
        }
    }

    pub fn insert_submissions(&self, submissions: &Vec<Submission>) {
        let query = r"INSERT INTO submissions
            (id, problem_id, contest_id, user_name, status, source_length, language, exec_time, point, created_time_sec)
            VALUES
            (:id, :problem_id, :contest_id, :user_name, :status, :source_length, :language, :exec_time, :point, :created_time_sec)";
        for mut statement in self.pool.prepare(query).into_iter() {
            for s in submissions.iter() {
                statement.execute(params! {
                    "id" => s.id,
                    "problem_id" => &s.problem,
                    "contest_id" => &s.contest,
                    "user_name" => &s.user,
                    "status" => &s.result,
                    "source_length" => s.code_length,
                    "language" => &s.language,
                    "exec_time" => &s.execution_time.or(Some(0)),
                    "point" => s.point,
                    "created_time_sec" => s.time,
                }).unwrap();
            }
        }
    }

    pub fn select_user_submission(&self, user: &str) -> Vec<Submission> {
        let query = format!("SELECT id, problem_id, contest_id, user_name, status, source_length, language, exec_time, point, created_time_sec FROM submissions WHERE user_name='{}'", user);
        self.pool.prep_exec(query, ())
            .map(|result| {
                result.map(|x| x.unwrap()).map(|row| {
                    let (id, problem_id, contest_id, user_name, status, source_length, language, exec_time, point, created_time_sec) = mysql::from_row(row);
                    Submission {
                        id,
                        problem: problem_id,
                        contest: contest_id,
                        user: user_name,
                        result: status,
                        code_length: source_length,
                        language,
                        execution_time: exec_time,
                        point,
                        time: created_time_sec,
                    }
                }).collect()
            }).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rand;
    use rand::Rng;

    static TEST_MYSQL_URI: &str = "mysql://root:@localhost:3306/test";

    #[test]
    fn connect_test() {
        let sql = SqlConnection::new(TEST_MYSQL_URI);
    }

    #[test]
    fn insert_submissions_test() {
        let mut rng = rand::thread_rng();
        let sql = SqlConnection::new(TEST_MYSQL_URI);

        let v = vec![
            Submission { id: rng.gen::<u32>() as usize, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: Some(25), contest: "abc000".to_owned() },
            Submission { id: rng.gen::<u32>() as usize, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: None, contest: "abc000".to_owned() }
        ];
        sql.insert_submissions(&v);
    }

    #[test]
    fn select_user_submission_test() {
        let mut rng = rand::thread_rng();
        let sql = SqlConnection::new(TEST_MYSQL_URI);
        let id = rng.gen::<u32>() as usize;

        let v = vec![
            Submission { id, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: Some(25), contest: "abc000".to_owned() },
        ];
        sql.insert_submissions(&v);
        let v1 = sql.select_user_submission("kenkoooo");
        assert!(v1.len() > 1);
        let mut contained = false;
        for submission in &v1 {
            if submission.id == id {
                contained = true;
            }
        }
        assert!(contained);

        let v2 = sql.select_user_submission("kenkoooo_");
        assert!(v2.len() == 0);
    }
}

