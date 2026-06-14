use std::collections::HashMap;

use crawler::{
    Contest, ContestFetcher, CrawlerClient, CrawlerError, Problem, ProblemFetcher, Submission,
};
use sea_orm::{
    ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter, Set, sea_query::OnConflict,
};

const ATCODER_WEEKDAY_CONTEST_CATEGORY: u32 = 20;
const ATCODER_DAILY_TRAINING_CATEGORY: u32 = 60;

/// Contest categories that AtCoder excludes from the unfiltered archive and
/// must therefore be crawled from their category-filtered archive pages.
/// Each entry is `(category id, human-readable label for logging)`.
const FILTERED_ARCHIVE_CATEGORIES: &[(u32, &str)] = &[
    (ATCODER_WEEKDAY_CONTEST_CATEGORY, "AtCoder Weekday Contest"),
    (ATCODER_DAILY_TRAINING_CATEGORY, "AtCoder Daily Training"),
];

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
            Err(CrawlerError::NotFound) => {
                tracing::warn!(
                    "Submissions page not found for contest {} page {} (404), skipping",
                    contest_id,
                    page
                );
                return vec![];
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
        if let Some(existing_submission) = existing_submission
            && existing_submission == &new_submission
        {
            continue;
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
/// 1. Fetches all contest_problem entries and builds a map
/// 2. Fetches all contests
/// 3. Finds contests that don't have any problems
/// 4. Crawls problems for each contest
/// 5. Upserts the problems into the database
///
/// Returns the total number of problems inserted/updated.
pub async fn crawl_problems(
    fetcher: &dyn ProblemFetcher,
    db: &DatabaseConnection,
) -> Result<usize, DbErr> {
    // Build a map of contest_id -> problem_ids from contest_problem table
    let contest_problems: HashMap<String, Vec<String>> =
        sql_entities::contest_problem::Entity::find()
            .all(db)
            .await?
            .into_iter()
            .fold(HashMap::new(), |mut map, cp| {
                map.entry(cp.contest_id).or_default().push(cp.problem_id);
                map
            });

    // Get all contests
    let all_contests = sql_entities::contests::Entity::find().all(db).await?;

    // Find contests without problems
    let contests_without_problems: Vec<_> = all_contests
        .into_iter()
        .filter(|c| !contest_problems.contains_key(&c.id))
        .map(|c| c.id)
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

    tracing::info!(
        "Finished crawling problems, total inserted: {}",
        total_inserted
    );

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
            Err(CrawlerError::NotFound) => {
                tracing::warn!(
                    "Tasks page not found for contest {} (404), skipping",
                    contest_id
                );
                return vec![];
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
        if let Err(e) = sql_entities::contest_problem::Entity::insert(contest_problem)
            .on_conflict(
                OnConflict::columns([
                    sql_entities::contest_problem::Column::ContestId,
                    sql_entities::contest_problem::Column::ProblemId,
                ])
                .update_column(sql_entities::contest_problem::Column::ProblemIndex)
                .to_owned(),
            )
            .exec(db)
            .await
        {
            tracing::warn!(
                "Failed to insert contest_problem for problem {}: {}",
                problem.id,
                e
            );
        }
    }
    Ok(new_problems.len())
}

/// Crawls contests from AtCoder and upserts them into the database.
///
/// This function:
/// 1. Fetches permanent contests (practice, APG4b, etc.)
/// 2. Fetches contests from archive pages (paginated)
/// 3. Fetches category-filtered contests (Weekday Contests, Daily Training)
///    from their category archives
/// 4. Upserts all contests into the database
///
/// Returns the total number of contests inserted/updated.
pub async fn crawl_contests(
    fetcher: &dyn ContestFetcher,
    db: &DatabaseConnection,
) -> Result<usize, DbErr> {
    let mut all_contests: Vec<Contest> = Vec::new();

    // Fetch permanent contests
    tracing::info!("Fetching permanent contests...");
    let permanent_contests = fetch_permanent_contests_with_retry(fetcher).await;
    tracing::info!("Fetched {} permanent contests", permanent_contests.len());
    all_contests.extend(permanent_contests);

    // Fetch contests from archive pages
    // We fetch pages until we get an empty page or the contests start overlapping with existing ones
    let mut page = 1;
    loop {
        tracing::info!("Fetching contests from archive page {}...", page);
        let contests = fetch_contests_with_retry(fetcher, page).await;

        if contests.is_empty() {
            tracing::info!("No more contests found on page {}", page);
            break;
        }

        tracing::info!("Fetched {} contests from page {}", contests.len(), page);
        all_contests.extend(contests);
        page += 1;

        // Rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    // AtCoder excludes some contest categories (e.g. Weekday Contests and
    // Daily Training) from the unfiltered archive, so crawl them from their
    // category-filtered archive pages.
    for &(category, label) in FILTERED_ARCHIVE_CATEGORIES {
        let mut page = 1;
        loop {
            tracing::info!("Fetching {} from archive page {}...", label, page);
            let contests = fetch_contests_in_category_with_retry(fetcher, page, category).await;

            if contests.is_empty() {
                tracing::info!("No more {} found on page {}", label, page);
                break;
            }

            tracing::info!("Fetched {} {} from page {}", contests.len(), label, page);
            all_contests.extend(contests);
            page += 1;

            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        }
    }

    tracing::info!("Total contests fetched: {}", all_contests.len());

    // Upsert contests
    let inserted = upsert_contests(db, all_contests).await?;
    tracing::info!("Finished crawling contests, total inserted: {}", inserted);

    Ok(inserted)
}

async fn fetch_permanent_contests_with_retry(fetcher: &dyn ContestFetcher) -> Vec<Contest> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match fetcher.fetch_permanent_contests().await {
            Ok(contests) => {
                return contests;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch permanent contests (attempt {}/{}): {}",
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!(
        "Failed to fetch permanent contests after {} retries",
        MAX_RETRIES
    );
    vec![]
}

async fn fetch_contests_with_retry(fetcher: &dyn ContestFetcher, page: u32) -> Vec<Contest> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match fetcher.fetch_contests(page).await {
            Ok(contests) => {
                return contests;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch contests page {} (attempt {}/{}): {}",
                    page,
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!(
        "Failed to fetch contests page {} after {} retries",
        page,
        MAX_RETRIES
    );
    vec![]
}

async fn fetch_contests_in_category_with_retry(
    fetcher: &dyn ContestFetcher,
    page: u32,
    category: u32,
) -> Vec<Contest> {
    const MAX_RETRIES: u32 = 10;
    let mut retry_count = 0;
    let mut retry_delay = 2000;

    while retry_count < MAX_RETRIES {
        match fetcher.fetch_contests_in_category(page, category).await {
            Ok(contests) => {
                return contests;
            }
            Err(e) => {
                retry_count += 1;
                tracing::warn!(
                    "Failed to fetch contests category {} page {} (attempt {}/{}): {}",
                    category,
                    page,
                    retry_count,
                    MAX_RETRIES,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_millis(retry_delay)).await;
                retry_delay *= 2;
            }
        }
    }

    tracing::error!(
        "Failed to fetch contests category {} page {} after {} retries",
        category,
        page,
        MAX_RETRIES
    );
    vec![]
}

async fn upsert_contests(db: &DatabaseConnection, contests: Vec<Contest>) -> Result<usize, DbErr> {
    for contest in &contests {
        let model = sql_entities::contests::ActiveModel {
            id: Set(contest.id.clone()),
            start_epoch_second: Set(contest.start_epoch_second),
            duration_second: Set(contest.duration_second),
            title: Set(contest.title.clone()),
            rate_change: Set(contest.rate_change.clone()),
        };
        sql_entities::contests::Entity::insert(model)
            .on_conflict(
                OnConflict::column(sql_entities::contests::Column::Id)
                    .update_columns([
                        sql_entities::contests::Column::StartEpochSecond,
                        sql_entities::contests::Column::DurationSecond,
                        sql_entities::contests::Column::Title,
                        sql_entities::contests::Column::RateChange,
                    ])
                    .to_owned(),
            )
            .exec(db)
            .await?;
    }
    Ok(contests.len())
}
