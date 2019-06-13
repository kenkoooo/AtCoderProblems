use atcoder_problems_backend::error::MapHandlerError;
use atcoder_problems_backend::s3;
use atcoder_problems_backend::sql::models::*;
use atcoder_problems_backend::sql::schema::*;
use atcoder_problems_backend::sql::LanguageCountClient;
use diesel::prelude::*;
use diesel::{sql_query, Connection, PgConnection};
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use serde::Serialize;
use serde_json;
use simple_logger;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(handler);
    Ok(())
}

fn handler(_: String, _: Context) -> Result<(), HandlerError> {
    info!("Started!");
    let url = env::var("SQL_URL")?;
    let conn: PgConnection = PgConnection::establish(&url).map_handler_error()?;

    let merged_query = sql_query(r"
            SELECT
                problems.id,
                problems.contest_id,
                problems.title,
                shortest.submission_id AS shortest_submission_id,
                shortest.problem_id AS shortest_problem_id,
                shortest.contest_id AS shortest_contest_id,
                shortest_submissions.user_id AS shortest_user_id,
                fastest.submission_id AS fastest_submission_id,
                fastest.problem_id AS fastest_problem_id,
                fastest.contest_id AS fastest_contest_id,
                fastest_submissions.user_id AS fastest_user_id,
                first.submission_id AS first_submission_id,
                first.problem_id AS first_problem_id,
                first.contest_id AS first_contest_id,
                first_submissions.user_id AS first_user_id,
                shortest_submissions.length AS source_code_length,
                fastest_submissions.execution_time AS execution_time,
                points.point,
                points.predict,
                solver.user_count AS solver_count
            FROM
                problems
                LEFT JOIN shortest ON shortest.problem_id = problems.id
                LEFT JOIN fastest ON fastest.problem_id = problems.id
                LEFT JOIN first ON first.problem_id = problems.id
                LEFT JOIN submissions AS shortest_submissions ON shortest.submission_id = shortest_submissions.id
                LEFT JOIN submissions AS fastest_submissions ON fastest.submission_id = fastest_submissions.id
                LEFT JOIN submissions AS first_submissions ON first.submission_id = first_submissions.id
                LEFT JOIN points ON points.problem_id = problems.id
                LEFT JOIN solver ON solver.problem_id = problems.id
                ORDER BY problems.id;
        ");

    let data_paths = vec![
        (
            merged_query
                .load::<MergedProblem>(&conn)
                .serialize_to_bytes()?,
            "resources/merged-problems.json",
        ),
        (
            contests::table
                .order_by(contests::id)
                .load::<Contest>(&conn)
                .serialize_to_bytes()?,
            "resources/contests.json",
        ),
        (
            accepted_count::table
                .order_by(accepted_count::user_id)
                .load::<UserProblemCount>(&conn)
                .serialize_to_bytes()?,
            "resources/ac.json",
        ),
        (
            problems::table
                .order_by(problems::id)
                .load::<Problem>(&conn)
                .serialize_to_bytes()?,
            "resources/problems.json",
        ),
        (
            rated_point_sum::table
                .order_by(rated_point_sum::user_id)
                .load::<UserSum>(&conn)
                .serialize_to_bytes()?,
            "resources/sums.json",
        ),
        (
            conn.load_language_count().serialize_to_bytes()?,
            "resources/lang.json",
        ),
        (
            minimum_performances::table
                .order_by(minimum_performances::problem_id)
                .load::<MinimumPerformance>(&conn)
                .serialize_to_bytes()?,
            "resources/problem-performances.json",
        ),
        (
            contest_problem::table
                .order_by(contest_problem::problem_id)
                .load::<ContestProblem>(&conn)
                .serialize_to_bytes()?,
            "resources/contest-problem.json",
        ),
        (
            contest_problem::table
                .order_by(contest_problem::problem_id)
                .load::<ContestProblem>(&conn)
                .serialize_to_bytes()?,
            "resources/contest-problem.json",
        ),
    ];

    let client = s3::S3Client::new();
    for (data, path) in data_paths.into_iter() {
        info!("Uploading {}", path);
        client.update(data, path, s3::ContentType::Json)?;
    }

    Ok(())
}

trait SerializeToBytes {
    fn serialize_to_bytes(self) -> Result<Vec<u8>, HandlerError>;
}

impl<T> SerializeToBytes for QueryResult<T>
where
    T: Serialize,
{
    fn serialize_to_bytes(self) -> Result<Vec<u8>, HandlerError> {
        let result = self.map_handler_error()?;
        let vec = serde_json::to_vec(&result)?;
        Ok(vec)
    }
}
