use mysql;
use mysql::Pool;
use scraper::{Submission, get_contest_time};

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

    pub fn insert_contests(&self, contests: &Vec<String>) {
        let query = r"INSERT INTO contests
            (id, name, start_sec, end_sec)
            VALUES
            (:id, :name, :start_sec, :end_sec)
            ON DUPLICATE KEY UPDATE name=:name";
        for mut statement in self.pool.prepare(query).into_iter() {
            for contest in contests.iter() {
                let (start, end, title) = get_contest_time(&contest);
                statement.execute(params! {
                    "id"    =>  &contest,
                    "name"  =>  &title,
                    "start_sec" =>  start,
                    "end_sec"   =>  end,
                }).unwrap();
            }
        }
    }

    pub fn insert_submissions(&self, submissions: &Vec<Submission>) {
        let query = r"INSERT INTO submissions
            (id, problem_id, contest_id, user_name, status, source_length, language, exec_time, point, created_time_sec)
            VALUES
            (:id, :problem_id, :contest_id, :user_name, :status, :source_length, :language, :exec_time, :point, :created_time_sec)
            ON DUPLICATE KEY UPDATE status=:status";
        for mut statement in self.pool.prepare(query).into_iter() {
            for s in submissions.iter() {
                if s.result.contains("/") {
                    continue;
                }
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

    pub fn select_user_submissions(&self, user: &str) -> Vec<Submission> {
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

    pub fn select_contest_submissions(&self, contest: &str) -> Vec<Submission> {
        let query = format!("SELECT id, problem_id, contest_id, user_name, status, source_length, language, exec_time, point, created_time_sec FROM submissions WHERE contest_id='{}'", contest);
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

    pub fn poll_oldest_crawled_contest(&self) -> String {
        let query = "SELECT id FROM contests ORDER BY last_crawled LIMIT 1";
        self.pool.prep_exec(query, ()).map(|mut result| {
            mysql::from_row(result.next().unwrap().unwrap())
        }).unwrap()
    }

    pub fn mark_as_crawled(&self, contest: &str) {
        let query = "UPDATE contests SET last_crawled=NOW() WHERE id=:id";
        for mut statement in self.pool.prepare(query).into_iter() {
            statement.execute(params! {
                "id"    =>  contest,
            }).unwrap();
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rand;
    use rand::Rng;
    use std::time::Duration;
    use std::thread;

    static TEST_MYSQL_URI: &str = "mysql://root:@localhost:3306/test";

    #[test]
    fn connect_test() {
        SqlConnection::new(TEST_MYSQL_URI);
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
    fn insert_contests_test() {
        let sql = SqlConnection::new(TEST_MYSQL_URI);

        let v = vec!["arc001".to_owned(), "abc001".to_owned()];
        sql.insert_contests(&v);
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
        let v1 = sql.select_user_submissions("kenkoooo");
        assert!(v1.len() > 1);
        let mut contained = false;
        for submission in &v1 {
            if submission.id == id {
                contained = true;
            }
        }
        assert!(contained);

        let v2 = sql.select_user_submissions("kenkoooo_");
        assert_eq!(v2.len(), 0);
    }

    #[test]
    fn skip_judging_submission() {
        let mut rng = rand::thread_rng();
        let sql = SqlConnection::new(TEST_MYSQL_URI);
        let id = rng.gen::<u32>() as usize;

        let v = vec![
            Submission { id, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "3/21".to_owned(), execution_time: Some(25), contest: "abc000".to_owned() },
        ];
        sql.insert_submissions(&v);
        let v1 = sql.select_user_submissions("kenkoooo");
        let mut contained = false;
        for submission in &v1 {
            if submission.id == id {
                contained = true;
            }
        }
        assert!(!contained);
    }

    #[test]
    fn poll_oldest_crawled_contest_test() {
        let sql = SqlConnection::new(TEST_MYSQL_URI);
        let v = vec!["arc001".to_owned(), "abc001".to_owned()];
        sql.insert_contests(&v);

        let id = sql.poll_oldest_crawled_contest();
        thread::sleep(Duration::from_millis(500));
        sql.mark_as_crawled(&id);
        let id2 = sql.poll_oldest_crawled_contest();
        assert_ne!(id.to_string(), id2.to_string());
    }

    #[test]
    fn select_contest_submissions_test() {
        let mut rng = rand::thread_rng();
        let sql = SqlConnection::new(TEST_MYSQL_URI);
        let id = rng.gen::<u32>() as usize;

        let v = vec![
            Submission { id, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: Some(25), contest: "abc000".to_owned() },
        ];
        sql.insert_submissions(&v);
        let v1 = sql.select_contest_submissions("abc000");
        assert!(v1.len() > 1);
        let mut contained = false;
        for submission in &v1 {
            if submission.id == id {
                contained = true;
            }
        }
        assert!(contained);
    }
}

