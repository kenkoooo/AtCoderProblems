use std::env;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use actix_web::{http, server, App, HttpRequest, HttpResponse};
use postgres::types::{FromSql, ToSql};
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

trait UserNameExtractor {
    fn extract_user(&self) -> String;
}

impl<T> UserNameExtractor for HttpRequest<T> {
    fn extract_user(&self) -> String {
        self.query()
            .get("user")
            .filter(|user| Regex::new("[a-zA-Z0-9_]+").unwrap().is_match(user))
            .map(|user| user.clone())
            .unwrap_or("".to_owned())
    }
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
    let user = request.extract_user();
    match get_connection(
        &request.state().postgresql_user,
        &request.state().postgresql_pass,
        &request.state().postgresql_host,
    )
    .and_then(|conn| get_submissions(&user, &conn))
    {
        Ok(submission) => HttpResponse::Ok().json(submission),
        _ => HttpResponse::new(http::StatusCode::INTERNAL_SERVER_ERROR),
    }
}

fn user_info_api(request: HttpRequest<Config>) -> HttpResponse {
    let user = request.extract_user();
    match get_connection(
        &request.state().postgresql_user,
        &request.state().postgresql_pass,
        &request.state().postgresql_host,
    )
    .and_then(|conn| {
        get_count_rank::<i32>(&user, &conn, "accepted_count", "problem_count", 0)
            .map(|(count, rank)| (count as usize, rank, conn))
    })
    .and_then(|(count, count_rank, conn)| {
        get_count_rank::<f64>(&user, &conn, "rated_point_sum", "point_sum", 0.0)
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

fn get_connection(user: &str, pass: &str, host: &str) -> Result<Connection, String> {
    Connection::connect(
        format!("postgresql://{}:{}@{}/atcoder", user, pass, host),
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

fn get_count_rank<T: FromSql + ToSql>(
    user: &str,
    conn: &Connection,
    table: &str,
    column: &str,
    min_count: T,
) -> Result<(T, usize), String> {
    let query = format!(
        "SELECT {column} FROM {table} WHERE user_id=$1",
        column = column,
        table = table
    );
    let rows = conn
        .query(&query, &[&user])
        .map_err(|e| format!("{:?}", e))?;
    let point: T = rows
        .iter()
        .map(|row| row.get(column))
        .next()
        .unwrap_or(min_count);

    let query = format!(
        "SELECT count(user_id) FROM {table} WHERE {column} > $1",
        table = table,
        column = column
    );
    let rows = conn
        .query(&query, &[&point])
        .map_err(|e| format!("{:?}", e))?;
    let rank: i64 = rows.iter().map(|row| row.get("count")).next().unwrap();
    Ok((point, rank as usize))
}
