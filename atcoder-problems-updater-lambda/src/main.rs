#[macro_use]
extern crate lambda_runtime as lambda;
extern crate openssl;

use atcoder_problems_sql_common::sql::SqlUpdater;
use diesel::{Connection, PgConnection};
use lambda::error::HandlerError;
use openssl_probe;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(my_handler);

    Ok(())
}

fn my_handler(_: String, c: lambda::Context) -> Result<String, HandlerError> {
    let url = env::var("SQL_URL").map_err(|_| c.new_error("SQL_URL must be set."))?;
    let conn = PgConnection::establish(&url).map_err(|_| c.new_error("Failed to connect."))?;

    println!("Executing update_accepted_count...");
    conn.update_accepted_count()
        .map_err(|_| c.new_error("Failed update_accepted_count"))?;
    println!("Executing update_problem_solver_count...");
    conn.update_problem_solver_count()
        .map_err(|_| c.new_error("Failed update_problem_solver_count"))?;
    println!("Executing update_rated_point_sums...");
    conn.update_rated_point_sums()
        .map_err(|_| c.new_error("Failed update_rated_point_sums"))?;
    println!("Executing update_language_count...");
    conn.update_language_count()
        .map_err(|_| c.new_error("Failed update_language_count"))?;
    println!("Executing update_great_submissions...");
    conn.update_great_submissions()
        .map_err(|_| c.new_error("Failed update_great_submissions"))?;
    println!("Executing aggregate_great_submissions...");
    conn.aggregate_great_submissions()
        .map_err(|_| c.new_error("Failed aggregate_great_submissions"))?;
    println!("Executing update_problem_points...");
    conn.update_problem_points()
        .map_err(|_| c.new_error("Failed update_problem_points"))?;
    Ok("Finished".to_owned())
}
