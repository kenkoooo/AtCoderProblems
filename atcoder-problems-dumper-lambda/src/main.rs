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
use rusoto_s3::{GetObjectRequest, PutObjectRequest, S3Client, S3};
use serde::Serialize;
use serde_json;
use std::env;
use std::error::Error;
use std::io::prelude::*;

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
                LEFT JOIN solver ON solver.problem_id = problems.id
                ORDER BY problems.id;
        ");

    let client = S3Client::new(Region::ApNortheast1);

    update(
        merged_query.load::<MergedProblem>(&conn).new_err(&c)?,
        "resources/merged-problems.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        contests::table
            .order_by(contests::id)
            .load::<Contest>(&conn)
            .new_err(&c)?,
        "resources/contests.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        accepted_count::table
            .order_by(accepted_count::user_id)
            .load::<UserProblemCount>(&conn)
            .new_err(&c)?,
        "resources/ac.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        problems::table
            .order_by(problems::id)
            .load::<Problem>(&conn)
            .new_err(&c)?,
        "resources/problems.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        shortest_submission_count::table
            .order_by(shortest_submission_count::user_id)
            .load::<UserProblemCount>(&conn)
            .new_err(&c)?,
        "resources/short.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        shortest_submission_count::table
            .order_by(shortest_submission_count::user_id)
            .load::<UserProblemCount>(&conn)
            .new_err(&c)?,
        "resources/short.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        fastest_submission_count::table
            .order_by(fastest_submission_count::user_id)
            .load::<UserProblemCount>(&conn)
            .new_err(&c)?,
        "resources/fast.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        first_submission_count::table
            .order_by(first_submission_count::user_id)
            .load::<UserProblemCount>(&conn)
            .new_err(&c)?,
        "resources/first.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        rated_point_sum::table
            .order_by(rated_point_sum::user_id)
            .load::<UserSum>(&conn)
            .new_err(&c)?,
        "resources/sums.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        language_count::table
            .order_by(language_count::user_id)
            .load::<UserLanguageCount>(&conn)
            .new_err(&c)?,
        "resources/lang.json",
        &client,
        &c,
    )
    .new_err(&c)?;
    update(
        minimum_performances::table
            .order_by(minimum_performances::problem_id)
            .load::<MinimumPerformance>(&conn)
            .new_err(&c)?,
        "resources/problem_performances.json",
        &client,
        &c,
    )
    .new_err(&c)?;

    Ok(String::new())
}

fn update<T>(
    new_vec: Vec<T>,
    path: &str,
    client: &S3Client,
    c: &lambda::Context,
) -> Result<(), HandlerError>
where
    T: Serialize,
{
    let mut get_request = GetObjectRequest::default();
    get_request.bucket = String::from("kenkoooo.com");
    get_request.key = String::from(path);

    info!("Downloading {}...", path);
    let old_string = client
        .get_object(get_request)
        .sync()
        .ok()
        .and_then(|object| object.body)
        .and_then(|stream| {
            let mut old_string = String::new();
            stream
                .into_blocking_read()
                .read_to_string(&mut old_string)
                .ok();
            Some(old_string)
        })
        .unwrap_or(String::new());

    info!("Serializing...");
    let new_string = serde_json::to_string(&new_vec).new_err(c)?;

    info!("Comparing...");
    let is_updated = old_string != new_string;
    if is_updated {
        info!("Updating {}...", path);
        let mut request = PutObjectRequest::default();
        request.bucket = String::from("kenkoooo.com");
        request.key = String::from(path);
        request.body = Some(ByteStream::from(new_string.as_bytes().to_vec()));
        request.content_type = Some(String::from("application/json;charset=utf-8"));
        client.put_object(request).sync().new_err(&c)?;
        info!("Updated");
    } else {
        info!("{} is not updated.", path);
    }

    Ok(())
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
