use std::env;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use iron;
use iron::prelude::*;
use postgres::{Connection, TlsMode};
use serde::Deserialize;
use urlencoded::UrlEncodedQuery;

#[derive(Deserialize, Debug)]
struct Config {
    postgresql_user: String,
    postgresql_pass: String,
    postgresql_host: String,
}

struct Submission {
    id: i64,
    epoch_second: i64,
    problem_id: String,
    contest_id: String,
    user_id: String,
    language: String,
    point: f64,
    length: i32,
    result: String,
    execution_time: Option<i32>,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = read_user_from_file(&args[1]).unwrap();

    let mut chain = Chain::new(result_api);
    Iron::new(chain).http("localhost:3000");
    // let submissions = get_connection(&config).and_then(|conn| get_submissions("kenkoooo", &conn));
}

fn result_api(req: &mut Request) -> IronResult<Response> {
    match req.get_ref::<UrlEncodedQuery>() {
        Ok(ref hashmap) => println!("Parsed GET request query string:\n {:?}", hashmap),
        Err(ref e) => println!("{:?}", e),
    };
    Ok(Response::with((iron::status::Ok, "Hello World")))
}

fn read_user_from_file<P: AsRef<Path>>(path: P) -> Result<Config, Box<Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let config = serde_json::from_reader(reader)?;
    Ok(config)
}

fn get_connection(config: &Config) -> Result<Connection, String> {
    Connection::connect(
        format!(
            "postgresql://{}:{}@{}/atcoder",
            config.postgresql_user, config.postgresql_pass, config.postgresql_host
        ),
        TlsMode::None,
    )
    .map_err(|e| format!("{:?}", e))
}

fn get_submissions(user: &str, conn: &Connection) -> Result<Vec<Submission>, String> {
    let query = r#"
            SELECT
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
            FROM submissions
            WHERE user_id=$1"#;
    let rows = conn
        .query(query, &[&user])
        .map_err(|e| format!("{:?}", e))?;
    let submissions = rows
        .iter()
        .map(|row| Submission {
            id: row.get("id"),
            epoch_second: row.get("epoch_second"),
            problem_id: row.get("problem_id"),
            contest_id: row.get("contest_id"),
            user_id: row.get("user_id"),
            language: row.get("language"),
            point: row.get("point"),
            length: row.get("length"),
            result: row.get("result"),
            execution_time: row.get("execution_time"),
        })
        .collect::<Vec<_>>();
    Ok(submissions)
}
