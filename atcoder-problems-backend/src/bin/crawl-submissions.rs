use std::{
    collections::{HashMap, HashSet},
    str::FromStr,
};

use atcoder_problems_backend::crawler_utils;
use crawler::CrawlerClient;
use rand::seq::SliceRandom;
use sea_orm::{
    ColumnTrait, Database, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, QuerySelect,
    sea_query::Expr, sea_query::ExprTrait,
};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();
    let args: Vec<String> = std::env::args().collect();
    let mode_arg = args.get(1).ok_or("mode argument is required")?;
    let mode = Mode::from_str(mode_arg)?;

    let db = setup_db().await?;
    let crawler = setup_crawler()?;

    let contest_ids = extract_contest_ids(&db, mode).await?;

    tracing::info!("Extracted {} contest ids", contest_ids.len());
    for contest_id in contest_ids {
        tracing::info!("Fetching submissions for contest {}", contest_id);

        let mut trial_count = 0;
        for page in 1.. {
            tracing::info!(
                "Fetching submissions for contest {} page {}",
                contest_id,
                page
            );
            let submissions = crawler_utils::fetch_submissions(&crawler, &contest_id, page).await;
            if submissions.is_empty() {
                tracing::info!("No more submissions for contest {}", contest_id);
                break;
            }

            tracing::info!("Inserting {} submissions", submissions.len());
            let inserted = crawler_utils::upsert_submissions(&db, submissions).await?;
            tracing::info!("Inserted {} submissions", inserted);

            if inserted > 0 {
                trial_count = 0;
            } else {
                trial_count += 1;
            }

            if trial_count >= 5 && (mode == Mode::New || mode == Mode::VirtualContests) {
                tracing::info!("No new submissions for contest {}", contest_id);
                break;
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }

        tracing::info!("Finished fetching submissions for contest {}", contest_id);
    }

    tracing::info!("Finished fetching submissions");
    Ok(())
}

async fn setup_db() -> Result<DatabaseConnection> {
    let database_url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL must be set")?;
    let db = Database::connect(&database_url).await?;
    Ok(db)
}

fn setup_crawler() -> Result<CrawlerClient> {
    let revel_session = std::env::var("REVEL_SESSION").map_err(|_| "REVEL_SESSION must be set")?;
    let crawler = CrawlerClient::new(revel_session)?;
    Ok(crawler)
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum Mode {
    All,
    Recent,
    New,
    VirtualContests,
}

impl FromStr for Mode {
    type Err = String;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s {
            "all" => Ok(Mode::All),
            "recent" => Ok(Mode::Recent),
            "new" => Ok(Mode::New),
            "virtual-contests" => Ok(Mode::VirtualContests),
            _ => Err("Invalid mode".to_string()),
        }
    }
}

async fn extract_contest_ids(db: &DatabaseConnection, mode: Mode) -> Result<HashSet<String>> {
    let contest_ids = match mode {
        Mode::All | Mode::New => {
            let mut contests = sql_entities::contests::Entity::find().all(db).await?;
            contests.shuffle(&mut rand::rng());
            contests.into_iter().map(|contest| contest.id).collect()
        }
        Mode::Recent => {
            let current_time = chrono::Utc::now().timestamp();
            sql_entities::contests::Entity::find()
                .filter(sql_entities::contests::Column::StartEpochSecond.lt(current_time))
                .order_by_desc(sql_entities::contests::Column::StartEpochSecond)
                .limit(5)
                .all(db)
                .await?
                .into_iter()
                .map(|contest| contest.id)
                .collect()
        }
        Mode::VirtualContests => {
            use sql_entities::{
                contest_problem, internal_virtual_contest_items, internal_virtual_contests,
            };
            let current_time = chrono::Utc::now().timestamp();
            let virtual_contests = internal_virtual_contests::Entity::find()
                .filter(
                    Expr::col(internal_virtual_contests::Column::StartEpochSecond)
                        .add(Expr::col(internal_virtual_contests::Column::DurationSecond))
                        .add(Expr::val(120))
                        .gt(current_time),
                )
                .filter(
                    Expr::col(internal_virtual_contests::Column::StartEpochSecond).lt(current_time),
                )
                .order_by_desc(internal_virtual_contests::Column::StartEpochSecond)
                .all(db)
                .await?;
            let internal_virtual_contest_ids =
                virtual_contests.iter().map(|contest| contest.id.as_str());
            let virtual_contest_problems = internal_virtual_contest_items::Entity::find()
                .filter(
                    internal_virtual_contest_items::Column::InternalVirtualContestId
                        .is_in(internal_virtual_contest_ids),
                )
                .all(db)
                .await?;
            let problem_ids = virtual_contest_problems
                .iter()
                .map(|item| item.problem_id.as_str());
            let contest_problems = contest_problem::Entity::find()
                .filter(contest_problem::Column::ProblemId.is_in(problem_ids))
                .all(db)
                .await?;

            let virtual_contest_by_id = virtual_contests
                .into_iter()
                .map(|contest| (contest.id.clone(), contest))
                .collect::<HashMap<_, _>>();

            let mut virtual_contest_ids_by_problem_id = HashMap::new();
            for problem in virtual_contest_problems {
                virtual_contest_ids_by_problem_id
                    .entry(problem.problem_id)
                    .or_insert_with(HashSet::new)
                    .insert(problem.internal_virtual_contest_id);
            }

            let mut min_remaining_by_contest_id = HashMap::new();
            for contest_problem in contest_problems {
                let contest_id = contest_problem.contest_id;
                let problem_id = contest_problem.problem_id;
                let virtual_contest_ids = virtual_contest_ids_by_problem_id.get(&problem_id);
                let Some(virtual_contest_ids) = virtual_contest_ids else {
                    continue;
                };
                for virtual_contest_id in virtual_contest_ids {
                    let Some(virtual_contest) = virtual_contest_by_id.get(virtual_contest_id)
                    else {
                        continue;
                    };

                    let remaining = virtual_contest.start_epoch_second
                        + virtual_contest.duration_second
                        - current_time;

                    let min_remaining = min_remaining_by_contest_id
                        .entry(contest_id.clone())
                        .or_insert(remaining);
                    *min_remaining = remaining.min(*min_remaining);
                }
            }

            let mut min_remainings = min_remaining_by_contest_id.into_iter().collect::<Vec<_>>();
            min_remainings.sort_by_key(|(_, remaining)| *remaining);
            min_remainings
                .into_iter()
                .take(200)
                .map(|(contest_id, _)| contest_id)
                .collect()
        }
    };
    Ok(contest_ids)
}
