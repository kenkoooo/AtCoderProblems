use std::env;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use actix_web::{http, server, App, HttpRequest, HttpResponse};
use postgres::{Connection, TlsMode};
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Clone)]
struct Config {
    postgresql_user: String,
    postgresql_pass: String,
    postgresql_host: String,
}

#[derive(Serialize, Debug)]
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

#[derive(Serialize, Debug)]
struct UserInfo {
    user_id: String,
    accepted_count: usize,
    accepted_count_rank: usize,
    rated_point_sum: f64,
    rated_point_sum_rank: usize,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = read_user_from_file(&args[1]).unwrap();

    server::new(move || {
        App::with_state(config.clone())
            .route("/results", http::Method::GET, result_api)
            .route("/v2/user_info", http::Method::GET, user_info_api)
    })
    .bind("127.0.0.1:8080")
    .unwrap()
    .run();
}

fn result_api(request: HttpRequest<Config>) -> HttpResponse {
    let user = request
        .query()
        .get("user")
        .filter(|user| Regex::new("[a-zA-Z0-9_]+").unwrap().is_match(user))
        .map(|user| user.clone())
        .unwrap_or("".to_owned());
    match get_connection(request.state()).and_then(|conn| get_submissions(&user, &conn)) {
        Ok(submission) => HttpResponse::Ok().json(submission),
        _ => HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

fn user_info_api(request: HttpRequest<Config>) -> HttpResponse {
    let user = request
        .query()
        .get("user")
        .filter(|user| Regex::new("[a-zA-Z0-9_]+").unwrap().is_match(user))
        .map(|user| user.clone())
        .unwrap_or("".to_owned());
    match get_connection(request.state())
        .and_then(|conn| get_accepted_count(&user, &conn).map(|(count, rank)| (count, rank, conn)))
        .and_then(|(count, count_rank, conn)| {
            get_rated_point_sum(&user, &conn)
                .map(|(point, point_rank)| (count, count_rank, point, point_rank))
        }) {
        Ok((accepted_count, accepted_count_rank, rated_point_sum, rated_point_sum_rank)) => {
            HttpResponse::Ok().json(UserInfo {
                user_id: user,
                accepted_count,
                accepted_count_rank,
                rated_point_sum,
                rated_point_sum_rank,
            })
        }
        _ => HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR),
    }
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

fn get_rated_point_sum(user: &str, conn: &Connection) -> Result<(f64, usize), String> {
    let query = "SELECT point_sum FROM rated_point_sum WHERE user_id=$1";
    let rows = conn
        .query(query, &[&user])
        .map_err(|e| format!("{:?}", e))?;
    let point: f64 = rows
        .iter()
        .map(|row| row.get("point_sum"))
        .next()
        .unwrap_or(0.0);

    let query = "SELECT count(user_id) FROM rated_point_sum WHERE point_sum > $1";
    let rows = conn
        .query(query, &[&point])
        .map_err(|e| format!("{:?}", e))?;
    let rank: i64 = rows.iter().map(|row| row.get("count")).next().unwrap();
    Ok((point, rank as usize))
}

fn get_accepted_count(user: &str, conn: &Connection) -> Result<(usize, usize), String> {
    let query = "SELECT problem_count FROM accepted_count WHERE user_id=$1";
    let rows = conn
        .query(query, &[&user])
        .map_err(|e| format!("{:?}", e))?;
    let point: i32 = rows
        .iter()
        .map(|row| row.get("problem_count"))
        .next()
        .unwrap_or(0);

    let query = "SELECT count(user_id) FROM accepted_count WHERE problem_count > $1";
    let rows = conn
        .query(query, &[&point])
        .map_err(|e| format!("{:?}", e))?;
    let rank: i64 = rows.iter().map(|row| row.get("count")).next().unwrap();
    Ok((point as usize, rank as usize))
}
