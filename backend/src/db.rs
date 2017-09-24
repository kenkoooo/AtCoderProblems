use mysql::Pool;
use scraper::Submission;

fn connect(uri: &str) -> Pool {
    match Pool::new(uri) {
        Err(_) => panic!("the connection to MySQL cannot be established."),
        Ok(p) => p
    }
}

fn insert_submissions(pool: &Pool, submissions: &Vec<Submission>) {
    let query = r"INSERT INTO submissions
    (id, problem_id, contest_id, user_name, status, source_length, language, exec_time, created_time_sec)
    VALUES
    (:id, :problem_id, :contest_id, :user_name, :status, :source_length, :language, :exec_time, :created_time_sec)";
    for mut statement in pool.prepare(query).into_iter() {
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
                "created_time_sec" => s.time,
            }).unwrap();
        }
    }
}


#[cfg(test)]
mod test {
    use super::*;
    use rand;
    use rand::Rng;

    #[test]
    fn connect_test() {
        let pool = connect("mysql://root:@localhost:3306/test");
    }

    #[test]
    fn insert_submissions_test() {
        let mut rng = rand::thread_rng();
        let pool = connect("mysql://root:@localhost:3306/test");
        let v = vec![
            Submission { id: rng.gen::<u32>() as usize, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: Some(25), contest: "abc000".to_owned() },
            Submission { id: rng.gen::<u32>() as usize, problem: "abc000_a".to_owned(), time: 111111, user: "kenkoooo".to_owned(), language: "Rust (1.20.1)".to_owned(), point: 400, code_length: 100, result: "AC".to_owned(), execution_time: None, contest: "abc000".to_owned() }
        ];
        insert_submissions(&pool, &v);
    }
}

