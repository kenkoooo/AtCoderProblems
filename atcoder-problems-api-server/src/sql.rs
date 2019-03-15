use postgres::types::{FromSql, ToSql};
use postgres::{Connection, TlsMode};

use crate::{Submission, UserInfo};

pub trait ConnectorTrait {
    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String>;
    fn get_user_info(&self, user_id: &str) -> Result<UserInfo, String>;
}

pub struct SqlConnector {
    conn: Connection,
}

impl SqlConnector {
    pub fn new(user: &str, pass: &str, host: &str) -> Result<Self, String> {
        Connection::connect(
            format!("postgresql://{}:{}@{}/atcoder", user, pass, host),
            TlsMode::None,
        )
        .map(|conn| SqlConnector { conn })
        .map_err(|e| format!("{:?}", e))
    }
}

impl ConnectorTrait for SqlConnector {
    fn get_submissions(&self, user: &str) -> Result<Vec<Submission>, String> {
        get_submissions(user, &self.conn)
    }

    fn get_user_info(&self, user_id: &str) -> Result<UserInfo, String> {
        let (accepted_count, accepted_count_rank) =
            get_count_rank::<i32>(user_id, &self.conn, "accepted_count", "problem_count", 0)?;
        let (rated_point_sum, rated_point_sum_rank) =
            get_count_rank::<f64>(user_id, &self.conn, "rated_point_sum", "point_sum", 0.0)?;
        Ok(UserInfo {
            user_id: user_id.to_owned(),
            accepted_count,
            accepted_count_rank,
            rated_point_sum,
            rated_point_sum_rank,
        })
    }
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
