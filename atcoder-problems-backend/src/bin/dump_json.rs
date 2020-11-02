use anyhow::Result;
use atcoder_problems_backend::s3;
use serde::Serialize;
use sql_client::accepted_count::AcceptedCountClient;
use sql_client::contest_problem::ContestProblemClient;
use sql_client::language_count::LanguageCountClient;
use sql_client::models::UserSum;
use sql_client::simple_client::SimpleClient;
use sql_client::{initialize_pool, PgRow};
use sql_client::{query, Row};
use std::env;

#[async_std::main]
async fn main() -> Result<()> {
    simple_logger::init_with_level(log::Level::Info)?;

    log::info!("Started!");
    let url = env::var("SQL_URL")?;
    let pg_pool = initialize_pool(&url).await?;

    let client = s3::S3Client::new()?;

    let mut contests = pg_pool.load_contests().await?;
    contests.sort_by_key(|c| c.id.clone());
    client.update(contests.serialize_to_bytes()?, "/resources/contests.json")?;

    let mut accepted_count = pg_pool.load_accepted_count().await?;
    accepted_count.sort_by_key(|c| c.user_id.clone());
    client.update(accepted_count.serialize_to_bytes()?, "/resources/ac.json")?;

    let mut problems = pg_pool.load_problems().await?;
    problems.sort_by_key(|p| p.id.clone());
    client.update(problems.serialize_to_bytes()?, "/resources/problems.json")?;

    let sums: Vec<UserSum> =
        query("SELECT user_id, point_sum FROM rated_point_sum ORDER BY user_id")
            .map(|row: PgRow| {
                let user_id: String = row.get("user_id");
                let point_sum: f64 = row.get("point_sum");
                UserSum { user_id, point_sum }
            })
            .fetch_all(&pg_pool)
            .await?;
    client.update(sums.serialize_to_bytes()?, "/resources/sums.json")?;

    let mut language_count = pg_pool.load_language_count().await?;
    language_count.sort_by_key(|l| (l.user_id.clone(), l.simplified_language.clone()));
    client.update(language_count.serialize_to_bytes()?, "/resources/lang.json")?;

    let mut contest_problem = pg_pool.load_contest_problem().await?;
    contest_problem.sort_by_key(|c| (c.contest_id.clone(), c.problem_id.clone()));
    client.update(
        contest_problem.serialize_to_bytes()?,
        "/resources/contest-problem.json",
    )?;

    let max_streaks: Vec<UserStreak> =
        query("SELECT user_id, streak FROM max_streaks ORDER BY user_id")
            .map(|row: PgRow| {
                let user_id: String = row.get("user_id");
                let streak: i64 = row.get("streak");
                UserStreak { user_id, streak }
            })
            .fetch_all(&pg_pool)
            .await?;
    client.update(max_streaks.serialize_to_bytes()?, "/resources/streaks.json")?;

    let max_streaks: Vec<MergedProblem> = query(
        r"
            SELECT
                problems.id AS merged_problem_id,
                problems.contest_id AS merged_contest_id,
                problems.title AS merged_problem_title,

                shortest.submission_id AS shortest_submission_id,
                shortest.contest_id AS shortest_contest_id,
                shortest_submissions.user_id AS shortest_user_id,

                fastest.submission_id AS fastest_submission_id,
                fastest.contest_id AS fastest_contest_id,
                fastest_submissions.user_id AS fastest_user_id,

                first.submission_id AS first_submission_id,
                first.contest_id AS first_contest_id,
                first_submissions.user_id AS first_user_id,

                shortest_submissions.length AS source_code_length,
                fastest_submissions.execution_time AS execution_time,
                points.point,
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
          ",
    )
    .map(|row: PgRow| {
        let id: String = row.get("merged_problem_id");
        let contest_id: String = row.get("merged_contest_id");
        let title: String = row.get("merged_problem_title");

        let shortest_submission_id: Option<i64> = row.get("shortest_submission_id");
        let shortest_contest_id: Option<String> = row.get("shortest_contest_id");
        let shortest_user_id: Option<String> = row.get("shortest_user_id");

        let fastest_submission_id: Option<i64> = row.get("fastest_submission_id");
        let fastest_contest_id: Option<String> = row.get("fastest_contest_id");
        let fastest_user_id: Option<String> = row.get("fastest_user_id");

        let first_submission_id: Option<i64> = row.get("first_submission_id");
        let first_contest_id: Option<String> = row.get("first_contest_id");
        let first_user_id: Option<String> = row.get("first_user_id");

        let source_code_length: Option<i32> = row.get("source_code_length");
        let execution_time: Option<i32> = row.get("execution_time");
        let point: Option<f64> = row.get("point");
        let solver_count: Option<i32> = row.get("solver_count");

        MergedProblem {
            id,
            contest_id,
            title,
            shortest_submission_id,
            shortest_contest_id,
            shortest_user_id,
            fastest_submission_id,
            fastest_contest_id,
            fastest_user_id,
            first_submission_id,
            first_contest_id,
            first_user_id,
            source_code_length,
            execution_time,
            point,
            solver_count
        }
    })
    .fetch_all(&pg_pool)
    .await?;
    client.update(
        max_streaks.serialize_to_bytes()?,
        "/resources/merged-problems.json",
    )?;

    log::info!("Done.");
    Ok(())
}

trait SerializeToBytes {
    fn serialize_to_bytes(self) -> Result<Vec<u8>>;
}

impl<T> SerializeToBytes for T
where
    T: Serialize,
{
    fn serialize_to_bytes(self) -> Result<Vec<u8>> {
        let vec = serde_json::to_vec(&self)?;
        Ok(vec)
    }
}

#[derive(Serialize)]
struct UserStreak {
    user_id: String,
    streak: i64,
}

#[derive(Serialize)]
struct MergedProblem {
    id: String,
    contest_id: String,
    title: String,
    shortest_submission_id: Option<i64>,
    shortest_contest_id: Option<String>,
    shortest_user_id: Option<String>,
    fastest_submission_id: Option<i64>,
    fastest_contest_id: Option<String>,
    fastest_user_id: Option<String>,
    first_submission_id: Option<i64>,
    first_contest_id: Option<String>,
    first_user_id: Option<String>,
    source_code_length: Option<i32>,
    execution_time: Option<i32>,
    point: Option<f64>,
    solver_count: Option<i32>,
}
