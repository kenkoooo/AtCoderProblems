use s3::S3Client;
use sea_orm::{Database, DatabaseConnection, EntityTrait, FromQueryResult, QueryOrder};
use serde::Serialize;
use std::cmp::Reverse;
use std::collections::BTreeMap;
use thiserror::Error;
use tokio::try_join;

const LANGUAGE_COUNT_LIMIT: usize = 1000;

#[derive(Error, Debug)]
enum DumpError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("S3 error: {0}")]
    S3(#[from] s3::S3Error),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Environment variable error: {0}")]
    EnvVar(#[from] std::env::VarError),
}

type Result<T> = std::result::Result<T, DumpError>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    tracing::info!("Starting dump-json...");

    let database_url = std::env::var("DATABASE_URL")?;
    let bucket_name = std::env::var("S3_BUCKET_NAME")?;

    let db = Database::connect(&database_url).await?;
    let s3 = S3Client::new(&bucket_name).await;

    // Run all dumps in parallel
    try_join!(
        dump_contests(&db, &s3),
        dump_problems(&db, &s3),
        dump_contest_problem(&db, &s3),
        dump_accepted_count(&db, &s3),
        dump_rated_point_sum(&db, &s3),
        dump_language_count(&db, &s3),
        dump_max_streaks(&db, &s3),
        dump_merged_problems(&db, &s3),
    )?;

    tracing::info!("Done.");
    Ok(())
}

async fn upload(s3: &S3Client, path: &str, data: Vec<u8>) -> Result<()> {
    tracing::info!("Checking {}...", path);
    let updated = s3.update(path, data).await?;
    if updated {
        tracing::info!("Updated {}", path);
    } else {
        tracing::info!("No update on {}", path);
    }
    Ok(())
}

async fn dump_contests(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let contests: Vec<Contest> = sql_entities::contests::Entity::find()
        .order_by_asc(sql_entities::contests::Column::Id)
        .into_model()
        .all(db)
        .await?;

    upload(s3, "/resources/contests.json", serde_json::to_vec(&contests)?).await
}

async fn dump_problems(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let problems: Vec<Problem> = sql_entities::problems::Entity::find()
        .order_by_asc(sql_entities::problems::Column::Id)
        .into_model()
        .all(db)
        .await?;

    upload(s3, "/resources/problems.json", serde_json::to_vec(&problems)?).await
}

async fn dump_contest_problem(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let contest_problem: Vec<ContestProblem> = sql_entities::contest_problem::Entity::find()
        .order_by_asc(sql_entities::contest_problem::Column::ContestId)
        .order_by_asc(sql_entities::contest_problem::Column::ProblemId)
        .into_model()
        .all(db)
        .await?;

    upload(
        s3,
        "/resources/contest-problem.json",
        serde_json::to_vec(&contest_problem)?,
    )
    .await
}

async fn dump_accepted_count(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let accepted_count: Vec<AcceptedCount> = sql_entities::accepted_count::Entity::find()
        .order_by_asc(sql_entities::accepted_count::Column::UserId)
        .into_model()
        .all(db)
        .await?;

    upload(s3, "/resources/ac.json", serde_json::to_vec(&accepted_count)?).await
}

async fn dump_rated_point_sum(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let sums: Vec<UserSum> = sql_entities::rated_point_sum::Entity::find()
        .order_by_asc(sql_entities::rated_point_sum::Column::UserId)
        .into_model()
        .all(db)
        .await?;

    upload(s3, "/resources/sums.json", serde_json::to_vec(&sums)?).await
}

async fn dump_language_count(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let all_counts: Vec<sql_entities::language_count::Model> =
        sql_entities::language_count::Entity::find().all(db).await?;

    // Group by language and keep top LANGUAGE_COUNT_LIMIT per language
    let mut by_language: BTreeMap<&str, Vec<&sql_entities::language_count::Model>> =
        BTreeMap::new();
    for entry in &all_counts {
        by_language
            .entry(&entry.simplified_language)
            .or_default()
            .push(entry);
    }

    let mut language_count: Vec<LanguageCount> = by_language
        .into_values()
        .flat_map(|mut entries| {
            entries.sort_by_key(|e| Reverse(e.problem_count));
            entries.truncate(LANGUAGE_COUNT_LIMIT);
            entries.into_iter().map(|e| LanguageCount {
                user_id: e.user_id.clone(),
                simplified_language: e.simplified_language.clone(),
                problem_count: e.problem_count,
            })
        })
        .collect();

    language_count.sort_by(|a, b| {
        a.user_id
            .cmp(&b.user_id)
            .then_with(|| a.simplified_language.cmp(&b.simplified_language))
    });

    upload(s3, "/resources/lang.json", serde_json::to_vec(&language_count)?).await
}

async fn dump_max_streaks(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let streaks: Vec<UserStreak> = sql_entities::max_streaks::Entity::find()
        .order_by_asc(sql_entities::max_streaks::Column::UserId)
        .into_model()
        .all(db)
        .await?;

    upload(s3, "/resources/streaks.json", serde_json::to_vec(&streaks)?).await
}

async fn dump_merged_problems(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let merged_problems: Vec<MergedProblem> = MergedProblem::find_by_statement(
        sea_orm::Statement::from_string(
            sea_orm::DatabaseBackend::Postgres,
            r#"
            SELECT
                p.id,
                p.contest_id,
                p.problem_index,
                p.name,
                p.title,
                sh.submission_id AS shortest_submission_id,
                sh.contest_id AS shortest_contest_id,
                sh_sub.user_id AS shortest_user_id,
                fa.submission_id AS fastest_submission_id,
                fa.contest_id AS fastest_contest_id,
                fa_sub.user_id AS fastest_user_id,
                fi.submission_id AS first_submission_id,
                fi.contest_id AS first_contest_id,
                fi_sub.user_id AS first_user_id,
                sh_sub.length AS source_code_length,
                fa_sub.execution_time,
                pt.point,
                so.user_count AS solver_count
            FROM problems p
            LEFT JOIN shortest sh ON sh.problem_id = p.id
            LEFT JOIN fastest fa ON fa.problem_id = p.id
            LEFT JOIN first fi ON fi.problem_id = p.id
            LEFT JOIN submissions sh_sub ON sh.submission_id = sh_sub.id
            LEFT JOIN submissions fa_sub ON fa.submission_id = fa_sub.id
            LEFT JOIN submissions fi_sub ON fi.submission_id = fi_sub.id
            LEFT JOIN points pt ON pt.problem_id = p.id
            LEFT JOIN solver so ON so.problem_id = p.id
            ORDER BY p.id
            "#,
        ),
    )
    .all(db)
    .await?;

    upload(
        s3,
        "/resources/merged-problems.json",
        serde_json::to_vec(&merged_problems)?,
    )
    .await
}

#[derive(Serialize, FromQueryResult)]
struct Contest {
    id: String,
    start_epoch_second: i64,
    duration_second: i64,
    title: String,
    rate_change: String,
}

#[derive(Serialize, FromQueryResult)]
struct Problem {
    id: String,
    contest_id: String,
    problem_index: String,
    name: String,
    title: String,
}

#[derive(Serialize, FromQueryResult)]
struct ContestProblem {
    contest_id: String,
    problem_id: String,
    problem_index: String,
}

#[derive(Serialize, FromQueryResult)]
struct AcceptedCount {
    user_id: String,
    problem_count: i32,
}

#[derive(Serialize, FromQueryResult)]
struct UserSum {
    user_id: String,
    point_sum: i64,
}

#[derive(Serialize)]
struct LanguageCount {
    user_id: String,
    simplified_language: String,
    problem_count: i32,
}

#[derive(Serialize, FromQueryResult)]
struct UserStreak {
    user_id: String,
    streak: i64,
}

#[derive(Serialize, FromQueryResult)]
struct MergedProblem {
    id: String,
    contest_id: String,
    problem_index: String,
    name: String,
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
