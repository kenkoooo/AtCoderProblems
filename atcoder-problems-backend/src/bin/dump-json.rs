use anyhow::Result;
use s3::S3Client;
use sea_orm::{Database, DatabaseConnection, EntityTrait, QueryOrder};
use serde::Serialize;
use std::cmp::Reverse;
use std::collections::{BTreeMap, HashMap};

const LANGUAGE_COUNT_LIMIT: usize = 1000;

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

    dump_contests(&db, &s3).await?;
    dump_problems(&db, &s3).await?;
    dump_contest_problem(&db, &s3).await?;
    dump_accepted_count(&db, &s3).await?;
    dump_rated_point_sum(&db, &s3).await?;
    dump_language_count(&db, &s3).await?;
    dump_max_streaks(&db, &s3).await?;
    dump_merged_problems(&db, &s3).await?;

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
    let contests: Vec<_> = sql_entities::contests::Entity::find()
        .order_by_asc(sql_entities::contests::Column::Id)
        .all(db)
        .await?;

    let output: Vec<_> = contests
        .into_iter()
        .map(|c| Contest {
            id: c.id,
            start_epoch_second: c.start_epoch_second,
            duration_second: c.duration_second,
            title: c.title,
            rate_change: c.rate_change,
        })
        .collect();

    upload(s3, "/resources/contests.json", serde_json::to_vec(&output)?).await
}

async fn dump_problems(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let problems: Vec<_> = sql_entities::problems::Entity::find()
        .order_by_asc(sql_entities::problems::Column::Id)
        .all(db)
        .await?;

    let output: Vec<_> = problems
        .into_iter()
        .map(|p| Problem {
            id: p.id,
            contest_id: p.contest_id,
            problem_index: p.problem_index,
            name: p.name,
            title: p.title,
        })
        .collect();

    upload(s3, "/resources/problems.json", serde_json::to_vec(&output)?).await
}

async fn dump_contest_problem(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let contest_problem: Vec<_> = sql_entities::contest_problem::Entity::find()
        .order_by_asc(sql_entities::contest_problem::Column::ContestId)
        .order_by_asc(sql_entities::contest_problem::Column::ProblemId)
        .all(db)
        .await?;

    let output: Vec<_> = contest_problem
        .into_iter()
        .map(|cp| ContestProblem {
            contest_id: cp.contest_id,
            problem_id: cp.problem_id,
            problem_index: cp.problem_index,
        })
        .collect();

    upload(
        s3,
        "/resources/contest-problem.json",
        serde_json::to_vec(&output)?,
    )
    .await
}

async fn dump_accepted_count(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let accepted_count: Vec<_> = sql_entities::accepted_count::Entity::find()
        .order_by_asc(sql_entities::accepted_count::Column::UserId)
        .all(db)
        .await?;

    let output: Vec<_> = accepted_count
        .into_iter()
        .map(|ac| AcceptedCount {
            user_id: ac.user_id,
            problem_count: ac.problem_count,
        })
        .collect();

    upload(s3, "/resources/ac.json", serde_json::to_vec(&output)?).await
}

async fn dump_rated_point_sum(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let sums: Vec<_> = sql_entities::rated_point_sum::Entity::find()
        .order_by_asc(sql_entities::rated_point_sum::Column::UserId)
        .all(db)
        .await?;

    let output: Vec<_> = sums
        .into_iter()
        .map(|s| UserSum {
            user_id: s.user_id,
            point_sum: s.point_sum,
        })
        .collect();

    upload(s3, "/resources/sums.json", serde_json::to_vec(&output)?).await
}

async fn dump_language_count(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let all_counts: Vec<_> = sql_entities::language_count::Entity::find().all(db).await?;

    // Group by language and keep top LANGUAGE_COUNT_LIMIT per language
    let mut by_language: BTreeMap<&str, Vec<&sql_entities::language_count::Model>> =
        BTreeMap::new();
    for entry in &all_counts {
        by_language
            .entry(&entry.simplified_language)
            .or_default()
            .push(entry);
    }

    let mut output: Vec<LanguageCount> = by_language
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

    output.sort_by(|a, b| {
        a.user_id
            .cmp(&b.user_id)
            .then_with(|| a.simplified_language.cmp(&b.simplified_language))
    });

    upload(s3, "/resources/lang.json", serde_json::to_vec(&output)?).await
}

async fn dump_max_streaks(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    let streaks: Vec<_> = sql_entities::max_streaks::Entity::find()
        .order_by_asc(sql_entities::max_streaks::Column::UserId)
        .all(db)
        .await?;

    let output: Vec<_> = streaks
        .into_iter()
        .map(|s| UserStreak {
            user_id: s.user_id,
            streak: s.streak,
        })
        .collect();

    upload(s3, "/resources/streaks.json", serde_json::to_vec(&output)?).await
}

async fn dump_merged_problems(db: &DatabaseConnection, s3: &S3Client) -> Result<()> {
    // Fetch all required data
    let problems = sql_entities::problems::Entity::find()
        .order_by_asc(sql_entities::problems::Column::Id)
        .all(db)
        .await?;

    let shortest: HashMap<_, _> = sql_entities::shortest::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|s| (s.problem_id.clone(), s))
        .collect();

    let fastest: HashMap<_, _> = sql_entities::fastest::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|f| (f.problem_id.clone(), f))
        .collect();

    let first: HashMap<_, _> = sql_entities::first::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|f| (f.problem_id.clone(), f))
        .collect();

    let points: HashMap<_, _> = sql_entities::points::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|p| (p.problem_id.clone(), p))
        .collect();

    let solver: HashMap<_, _> = sql_entities::solver::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|s| (s.problem_id.clone(), s))
        .collect();

    let submissions: HashMap<_, _> = sql_entities::submissions::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|s| (s.id, s))
        .collect();

    // Merge data
    let output: Vec<_> = problems
        .into_iter()
        .map(|p| {
            let sh = shortest.get(&p.id);
            let fa = fastest.get(&p.id);
            let fi = first.get(&p.id);
            let pt = points.get(&p.id);
            let so = solver.get(&p.id);

            let sh_sub = sh.and_then(|s| submissions.get(&s.submission_id));
            let fa_sub = fa.and_then(|f| submissions.get(&f.submission_id));
            let fi_sub = fi.and_then(|f| submissions.get(&f.submission_id));

            MergedProblem {
                id: p.id,
                contest_id: p.contest_id,
                problem_index: p.problem_index,
                name: p.name,
                title: p.title,
                shortest_submission_id: sh.map(|s| s.submission_id),
                shortest_contest_id: sh.map(|s| s.contest_id.clone()),
                shortest_user_id: sh_sub.map(|s| s.user_id.clone()),
                fastest_submission_id: fa.map(|f| f.submission_id),
                fastest_contest_id: fa.map(|f| f.contest_id.clone()),
                fastest_user_id: fa_sub.map(|s| s.user_id.clone()),
                first_submission_id: fi.map(|f| f.submission_id),
                first_contest_id: fi.map(|f| f.contest_id.clone()),
                first_user_id: fi_sub.map(|s| s.user_id.clone()),
                source_code_length: sh_sub.map(|s| s.length),
                execution_time: fa_sub.and_then(|s| s.execution_time),
                point: pt.and_then(|p| p.point),
                solver_count: so.map(|s| s.user_count),
            }
        })
        .collect();

    upload(
        s3,
        "/resources/merged-problems.json",
        serde_json::to_vec(&output)?,
    )
    .await
}

#[derive(Serialize)]
struct Contest {
    id: String,
    start_epoch_second: i64,
    duration_second: i64,
    title: String,
    rate_change: String,
}

#[derive(Serialize)]
struct Problem {
    id: String,
    contest_id: String,
    problem_index: String,
    name: String,
    title: String,
}

#[derive(Serialize)]
struct ContestProblem {
    contest_id: String,
    problem_id: String,
    problem_index: String,
}

#[derive(Serialize)]
struct AcceptedCount {
    user_id: String,
    problem_count: i32,
}

#[derive(Serialize)]
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

#[derive(Serialize)]
struct UserStreak {
    user_id: String,
    streak: i64,
}

#[derive(Serialize)]
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
