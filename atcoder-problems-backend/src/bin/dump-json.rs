use s3::S3Client;
use sea_orm::{Database, DatabaseConnection, EntityTrait, FromQueryResult, QueryOrder};
use serde::Serialize;
use std::cmp::Reverse;
use std::collections::BTreeMap;

const LANGUAGE_COUNT_LIMIT: usize = 1000;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let db = setup_db().await.expect("Failed to connect to database");
    let s3 = setup_s3().await;

    dump_contests(&db, &s3).await;
    dump_problems(&db, &s3).await;
    dump_contest_problem(&db, &s3).await;
    dump_accepted_count(&db, &s3).await;
    dump_rated_point_sum(&db, &s3).await;
    dump_language_count(&db, &s3).await;
    dump_max_streaks(&db, &s3).await;
    dump_merged_problems(&db, &s3).await;

    tracing::info!("Done.");
}

async fn setup_db() -> Result<DatabaseConnection, sea_orm::DbErr> {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;
    Ok(db)
}

async fn setup_s3() -> S3Client {
    let bucket_name = std::env::var("S3_BUCKET_NAME").expect("S3_BUCKET_NAME must be set");
    S3Client::new(&bucket_name).await
}

async fn dump_contests(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping contests...");
    let contests: Vec<Contest> = sql_entities::contests::Entity::find()
        .order_by_asc(sql_entities::contests::Column::Id)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load contests");

    let json = serde_json::to_vec(&contests).expect("Failed to serialize contests");
    s3.put_object("resources/contests.json", json)
        .await
        .expect("Failed to put contests");
}

async fn dump_problems(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping problems...");
    let problems: Vec<Problem> = sql_entities::problems::Entity::find()
        .order_by_asc(sql_entities::problems::Column::Id)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load problems");

    let json = serde_json::to_vec(&problems).expect("Failed to serialize problems");
    s3.put_object("resources/problems.json", json)
        .await
        .expect("Failed to put problems");
}

async fn dump_contest_problem(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping contest_problem...");
    let contest_problem: Vec<ContestProblem> = sql_entities::contest_problem::Entity::find()
        .order_by_asc(sql_entities::contest_problem::Column::ContestId)
        .order_by_asc(sql_entities::contest_problem::Column::ProblemId)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load contest_problem");

    let json = serde_json::to_vec(&contest_problem).expect("Failed to serialize contest_problem");
    s3.put_object("resources/contest-problem.json", json)
        .await
        .expect("Failed to put contest_problem");
}

async fn dump_accepted_count(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping accepted_count...");
    let accepted_count: Vec<AcceptedCount> = sql_entities::accepted_count::Entity::find()
        .order_by_asc(sql_entities::accepted_count::Column::UserId)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load accepted_count");

    let json = serde_json::to_vec(&accepted_count).expect("Failed to serialize accepted_count");
    s3.put_object("resources/ac.json", json)
        .await
        .expect("Failed to put accepted_count");
}

async fn dump_rated_point_sum(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping rated_point_sum...");
    let sums: Vec<UserSum> = sql_entities::rated_point_sum::Entity::find()
        .order_by_asc(sql_entities::rated_point_sum::Column::UserId)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load rated_point_sum");

    let json = serde_json::to_vec(&sums).expect("Failed to serialize rated_point_sum");
    s3.put_object("resources/sums.json", json)
        .await
        .expect("Failed to put rated_point_sum");
}

async fn dump_language_count(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping language_count...");
    let language_count: Vec<LanguageCount> = sql_entities::language_count::Entity::find()
        .all(db)
        .await
        .expect("Failed to load language_count")
        .into_iter()
        .map(|m| LanguageCount {
            user_id: m.user_id,
            simplified_language: m.simplified_language,
            problem_count: m.problem_count,
        })
        .collect();

    // Keep only top LANGUAGE_COUNT_LIMIT per language
    let mut reduced: BTreeMap<String, Vec<LanguageCount>> = BTreeMap::new();
    for entry in language_count {
        reduced
            .entry(entry.simplified_language.clone())
            .or_default()
            .push(entry);
    }

    for vec in reduced.values_mut() {
        vec.sort_by_key(|e| Reverse(e.problem_count));
        vec.truncate(LANGUAGE_COUNT_LIMIT);
    }

    let mut language_count: Vec<LanguageCount> =
        reduced.into_values().flatten().collect::<Vec<_>>();
    language_count.sort_by(|a, b| {
        a.user_id
            .cmp(&b.user_id)
            .then_with(|| a.simplified_language.cmp(&b.simplified_language))
    });

    let json = serde_json::to_vec(&language_count).expect("Failed to serialize language_count");
    s3.put_object("resources/lang.json", json)
        .await
        .expect("Failed to put language_count");
}

async fn dump_max_streaks(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping max_streaks...");
    let streaks: Vec<UserStreak> = sql_entities::max_streaks::Entity::find()
        .order_by_asc(sql_entities::max_streaks::Column::UserId)
        .into_model()
        .all(db)
        .await
        .expect("Failed to load max_streaks");

    let json = serde_json::to_vec(&streaks).expect("Failed to serialize max_streaks");
    s3.put_object("resources/streaks.json", json)
        .await
        .expect("Failed to put max_streaks");
}

async fn dump_merged_problems(db: &DatabaseConnection, s3: &S3Client) {
    tracing::info!("Dumping merged_problems...");

    let merged_problems: Vec<MergedProblem> = MergedProblem::find_by_statement(
        sea_orm::Statement::from_string(
            sea_orm::DatabaseBackend::Postgres,
            r#"
            SELECT
                problems.id AS id,
                problems.contest_id AS contest_id,
                problems.problem_index AS problem_index,
                problems.name AS name,
                problems.title AS title,

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
            ORDER BY problems.id
            "#,
        ),
    )
    .all(db)
    .await
    .expect("Failed to load merged_problems");

    let json = serde_json::to_vec(&merged_problems).expect("Failed to serialize merged_problems");
    s3.put_object("resources/merged-problems.json", json)
        .await
        .expect("Failed to put merged_problems");
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

#[derive(Serialize, Clone)]
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
