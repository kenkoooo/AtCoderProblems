use std::collections::{HashMap, HashSet};

use crawler::{CrawlerClient, ProblemFetcher, Problem, Submission};
use sea_orm::{
    ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter, QuerySelect, Set,
    sea_query::OnConflict,
};

pub async fn fetch_submissions(
    crawler: &CrawlerClient,
    contest_id: &str,
    page: i32,
) -> Vec<Submission> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match crawler.fetch_submissions(contest_id, page).await {
            Ok(submissions) => {
                return submissions;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch submissions (attempt {}/{}): {}",
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!("Failed to fetch submissions after {} retries", MAX_RETRIES);
    vec![]
}

pub async fn upsert_submissions(
    db: &DatabaseConnection,
    new_submissions: Vec<Submission>,
) -> Result<usize, DbErr> {
    let existing_submissions = sql_entities::submissions::Entity::find()
        .filter(sql_entities::submissions::Column::Id.is_in(new_submissions.iter().map(|s| s.id)))
        .all(db)
        .await?
        .into_iter()
        .map(|s| {
            (
                s.id,
                Submission {
                    id: s.id,
                    epoch_second: s.epoch_second,
                    problem_id: s.problem_id,
                    contest_id: s.contest_id,
                    user: s.user_id,
                    language: s.language,
                    score: s.point,
                    code_length: s.length,
                    result: s.result,
                    execution_time: s.execution_time,
                },
            )
        })
        .collect::<HashMap<_, _>>();

    let mut inserted_submissions = 0;
    for new_submission in new_submissions {
        let existing_submission = existing_submissions.get(&new_submission.id);
        if let Some(existing_submission) = existing_submission {
            if existing_submission == &new_submission {
                continue;
            }
        }

        let submission = sql_entities::submissions::ActiveModel {
            id: Set(new_submission.id),
            epoch_second: Set(new_submission.epoch_second),
            problem_id: Set(new_submission.problem_id),
            contest_id: Set(new_submission.contest_id),
            user_id: Set(new_submission.user),
            language: Set(new_submission.language),
            point: Set(new_submission.score),
            length: Set(new_submission.code_length),
            result: Set(new_submission.result),
            execution_time: Set(new_submission.execution_time),
        };
        sql_entities::submissions::Entity::insert(submission)
            .on_conflict(
                OnConflict::column(sql_entities::submissions::Column::Id)
                    .update_columns([
                        sql_entities::submissions::Column::EpochSecond,
                        sql_entities::submissions::Column::ProblemId,
                        sql_entities::submissions::Column::ContestId,
                        sql_entities::submissions::Column::UserId,
                        sql_entities::submissions::Column::Language,
                        sql_entities::submissions::Column::Point,
                        sql_entities::submissions::Column::Length,
                        sql_entities::submissions::Column::Result,
                        sql_entities::submissions::Column::ExecutionTime,
                    ])
                    .to_owned(),
            )
            .exec(db)
            .await?;
        inserted_submissions += 1;
    }
    Ok(inserted_submissions)
}

/// Crawls problems for all contests that don't have problems yet.
///
/// This function:
/// 1. Fetches all contest IDs from the database
/// 2. Finds contests that don't have any problems
/// 3. Crawls problems for each contest
/// 4. Upserts the problems into the database
///
/// Returns the total number of problems inserted/updated.
pub async fn crawl_problems(
    fetcher: &dyn ProblemFetcher,
    db: &DatabaseConnection,
) -> Result<usize, DbErr> {
    // Get all contest IDs
    let all_contest_ids: HashSet<_> = sql_entities::contests::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|c| c.id)
        .collect();

    // Get contest IDs that already have problems (from contest_problem table)
    let contest_ids_with_problems: HashSet<_> = sql_entities::contest_problem::Entity::find()
        .select_only()
        .column(sql_entities::contest_problem::Column::ContestId)
        .distinct()
        .into_tuple::<String>()
        .all(db)
        .await?
        .into_iter()
        .collect();

    // Find contests without problems
    let contests_without_problems: Vec<_> = all_contest_ids
        .difference(&contest_ids_with_problems)
        .cloned()
        .collect();

    tracing::info!(
        "Found {} contests without problems",
        contests_without_problems.len()
    );

    let mut total_inserted = 0;

    for contest_id in contests_without_problems {
        tracing::info!("Fetching problems for contest {}", contest_id);

        let problems = fetch_problems_with_retry(fetcher, &contest_id).await;

        if problems.is_empty() {
            tracing::warn!("No problems found for contest {}", contest_id);
            continue;
        }

        tracing::info!(
            "Inserting {} problems for contest {}",
            problems.len(),
            contest_id
        );

        let inserted = upsert_problems(db, problems).await?;
        tracing::info!("Inserted {} problems for contest {}", inserted, contest_id);
        total_inserted += inserted;

        // Rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    tracing::info!("Finished crawling problems, total inserted: {}", total_inserted);

    Ok(total_inserted)
}

async fn fetch_problems_with_retry(fetcher: &dyn ProblemFetcher, contest_id: &str) -> Vec<Problem> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match fetcher.fetch_problems(contest_id).await {
            Ok(problems) => {
                return problems;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch problems (attempt {}/{}): {}",
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!("Failed to fetch problems after {} retries", MAX_RETRIES);
    vec![]
}

async fn upsert_problems(
    db: &DatabaseConnection,
    new_problems: Vec<Problem>,
) -> Result<usize, DbErr> {
    for problem in &new_problems {
        // Insert into problems table
        let title = problem.title();
        let model = sql_entities::problems::ActiveModel {
            id: Set(problem.id.clone()),
            contest_id: Set(problem.contest_id.clone()),
            problem_index: Set(problem.problem_index.clone()),
            name: Set(problem.name.clone()),
            title: Set(title),
        };
        sql_entities::problems::Entity::insert(model)
            .on_conflict(
                OnConflict::column(sql_entities::problems::Column::Id)
                    .update_columns([
                        sql_entities::problems::Column::ContestId,
                        sql_entities::problems::Column::ProblemIndex,
                        sql_entities::problems::Column::Name,
                        sql_entities::problems::Column::Title,
                    ])
                    .to_owned(),
            )
            .exec(db)
            .await?;

        // Insert into contest_problem table
        let contest_problem = sql_entities::contest_problem::ActiveModel {
            contest_id: Set(problem.contest_id.clone()),
            problem_id: Set(problem.id.clone()),
            problem_index: Set(problem.problem_index.clone()),
        };
        sql_entities::contest_problem::Entity::insert(contest_problem)
            .on_conflict(
                OnConflict::columns([
                    sql_entities::contest_problem::Column::ContestId,
                    sql_entities::contest_problem::Column::ProblemId,
                    sql_entities::contest_problem::Column::ProblemIndex,
                ])
                .do_nothing()
                .to_owned(),
            )
            .exec(db)
            .await
            .ok(); // Ignore duplicate key errors
    }
    Ok(new_problems.len())
}
