#[macro_use]
extern crate log;
extern crate simple_logger;

#[macro_use]
extern crate lambda_runtime as lambda;
extern crate openssl;

use atcoder_problems_dumper_lambda::models::*;
use atcoder_problems_sql_common::schema::*;
use diesel::prelude::*;
use diesel::{sql_query, Connection, PgConnection};
use lambda::error::HandlerError;
use openssl_probe;
use rusoto_core::{ByteStream, Region};
use rusoto_s3::{PutObjectRequest, S3Client, S3};
use serde::Serialize;
use serde_json;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(my_handler);

    Ok(())
}

fn my_handler(_: String, c: lambda::Context) -> Result<String, HandlerError> {
    info!("Started!");
    let url = env::var("SQL_URL").new_err(&c)?;
    let conn = PgConnection::establish(&url).new_err(&c)?;

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
                LEFT JOIN solver ON solver.problem_id = problems.id;
        ");

    let data = vec![
        create_request(
            merged_query.load::<MergedProblem>(&conn).new_err(&c)?,
            "resources/merged-problems.json",
        ),
        create_request(
            contests::table.load::<Contest>(&conn).new_err(&c)?,
            "resources/contests.json",
        ),
        create_request(
            accepted_count::table
                .load::<UserProblemCount>(&conn)
                .new_err(&c)?,
            "resources/ac.json",
        ),
        create_request(
            problems::table.load::<Problem>(&conn).new_err(&c)?,
            "resources/problems.json",
        ),
        create_request(
            shortest_submission_count::table
                .load::<UserProblemCount>(&conn)
                .new_err(&c)?,
            "resources/short.json",
        ),
        create_request(
            shortest_submission_count::table
                .load::<UserProblemCount>(&conn)
                .new_err(&c)?,
            "resources/short.json",
        ),
        create_request(
            fastest_submission_count::table
                .load::<UserProblemCount>(&conn)
                .new_err(&c)?,
            "resources/fast.json",
        ),
        create_request(
            first_submission_count::table
                .load::<UserProblemCount>(&conn)
                .new_err(&c)?,
            "resources/first.json",
        ),
        create_request(
            rated_point_sum::table.load::<UserSum>(&conn).new_err(&c)?,
            "resources/sums.json",
        ),
        create_request(
            language_count::table
                .load::<UserLanguageCount>(&conn)
                .new_err(&c)?,
            "resources/lang.json",
        ),
    ];

    let client = S3Client::new(Region::ApNortheast1);
    for request in data.into_iter() {
        let request = request.new_err(&c)?;
        info!("Sending to {} ...", request.key);
        client.put_object(request).sync().new_err(&c)?;
    }

    Ok(String::new())
}

fn create_request<T: Serialize>(obj: T, path: &str) -> serde_json::Result<PutObjectRequest> {
    let mut request = PutObjectRequest::default();
    request.bucket = String::from("kenkoooo.com");
    request.key = String::from(path);
    request.body = Some(ByteStream::from(
        serde_json::to_string(&obj)?.as_bytes().to_vec(),
    ));
    request.content_type = Some(String::from("application/json;charset=utf-8"));
    Ok(request)
}

trait ErrorMapper<S> {
    fn new_err(self, c: &lambda::Context) -> Result<S, HandlerError>;
}

impl<S, T> ErrorMapper<S> for Result<S, T>
where
    T: std::fmt::Debug,
{
    fn new_err(self, c: &lambda::Context) -> Result<S, HandlerError> {
        self.map_err(|e| c.new_error(&format!("{:?}", e)))
    }
}
