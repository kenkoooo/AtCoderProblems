use postgres::types::{FromSql, ToSql};
use postgres::{Connection, TlsMode};

use crate::{Submission, UserInfo};

pub(crate) trait Connector {
    fn new(user: &str, pass: &str, host: &str) -> Self;
    fn get_submission(user: &str) -> Result<Vec<Submission>, String>;
    fn get_user_info(user: &str) -> Result<UserInfo, String>;
}

pub(crate) struct SqlClient {
    conn: Connection,
}


pub fn get_connection(user: &str, pass: &str, host: &str) -> Result<Connection, String> {
    Connection::connect(
        format!("postgresql://{}:{}@{}/atcoder", user, pass, host),
        TlsMode::None,
    )
    .map_err(|e| format!("{:?}", e))
}

pub fn get_submissions(user: &str, conn: &Connection) -> Result<Vec<Submission>, String> {
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

pub fn get_count_rank<T: FromSql + ToSql>(
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
