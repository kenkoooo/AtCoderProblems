use postgres::{Connection, TlsMode};

use serde::Deserialize;

use std::env;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

#[derive(Deserialize, Debug)]
struct Config {
    postgresql_user: String,
    postgresql_pass: String,
    postgresql_host: String,
}

struct Submission {
    id: u32,
    epoch_second: i64,
    problem_id: String,
    contest_id: String,
    user_id: String,
    language: String,
    point: u32,
    length: u32,
    result: String,
    execution_time: Option<u32>,
}

fn read_user_from_file<P: AsRef<Path>>(path: P) -> Result<Config, Box<Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let config = serde_json::from_reader(reader)?;
    Ok(config)
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = read_user_from_file(&args[1]).unwrap();

    let conn = Connection::connect(
        format!(
            "postgresql://{}:{}@{}/atcoder",
            config.postgresql_user, config.postgresql_pass, config.postgresql_host
        ),
        TlsMode::None,
    )
    .unwrap();

    let user = "kenkoooo";
    get_submissions(user, &conn).unwrap();
}

fn get_submissions(user: &str, conn: &Connection) -> Result<(), ()> {
    let rows = conn.query("SELECT id, epoch_second, problem_id, contest_id, user_id, language, point, length, result, execution_time FROM submissions WHERE user_id=$1", &[&user]).map_err(|_| ())?;
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

    println!("{}", submissions.len());

    Ok(())
}
