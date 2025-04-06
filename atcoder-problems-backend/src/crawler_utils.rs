use std::collections::HashMap;

use crawler::{CrawlerClient, Submission};
use sea_orm::{
    ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter, Set, sea_query::OnConflict,
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
                    score: s.point.to_string(),
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
            point: Set(new_submission.score.parse().expect("Failed to parse score")),
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
