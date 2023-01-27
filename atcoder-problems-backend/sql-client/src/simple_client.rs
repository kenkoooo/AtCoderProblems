use crate::models::{Contest, Problem};
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait SimpleClient {
    async fn insert_contests(&self, values: &[Contest]) -> Result<usize>;
    async fn insert_problems(&self, values: &[Problem]) -> Result<usize>;
    async fn load_problems(&self) -> Result<Vec<Problem>>;
    async fn load_contests(&self) -> Result<Vec<Contest>>;
}

#[async_trait]
impl SimpleClient for PgPool {
    async fn insert_contests(&self, values: &[Contest]) -> Result<usize> {
        let (ids, start_epoch_seconds, duration_seconds, titles, rate_changes) =
            values.iter().fold(
                (vec![], vec![], vec![], vec![], vec![]),
                |(
                    mut ids,
                    mut start_epoch_seconds,
                    mut duration_seconds,
                    mut titles,
                    mut rate_changes,
                ),
                 cur| {
                    ids.push(cur.id.as_str());
                    start_epoch_seconds.push(cur.start_epoch_second);
                    duration_seconds.push(cur.duration_second);
                    titles.push(cur.title.as_str());
                    rate_changes.push(cur.rate_change.as_str());
                    (
                        ids,
                        start_epoch_seconds,
                        duration_seconds,
                        titles,
                        rate_changes,
                    )
                },
            );

        let result = sqlx::query(
            r"
            INSERT INTO contests
            (id, start_epoch_second, duration_second, title, rate_change)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::BIGINT[]),
                UNNEST($3::BIGINT[]),
                UNNEST($4::VARCHAR(255)[]),
                UNNEST($5::VARCHAR(255)[])
            )
            ON CONFLICT DO NOTHING
            ",
        )
        .bind(ids)
        .bind(start_epoch_seconds)
        .bind(duration_seconds)
        .bind(titles)
        .bind(rate_changes)
        .execute(self)
        .await?;

        Ok(result.rows_affected() as usize)
    }

    async fn insert_problems(&self, values: &[Problem]) -> Result<usize> {
        let (ids, contest_ids, problem_indexes, names, titles) = values.iter().fold(
            (vec![], vec![], vec![], vec![], vec![]),
            |(mut ids, mut contest_ids, mut problem_indexes, mut names, mut titles), cur| {
                ids.push(cur.id.as_str());
                contest_ids.push(cur.contest_id.as_str());
                problem_indexes.push(cur.problem_index.as_str());
                names.push(cur.name.as_str());
                titles.push(cur.title.as_str());
                (ids, contest_ids, problem_indexes, names, titles)
            },
        );

        let result = sqlx::query(
            r"
            INSERT INTO problems
            (id, contest_id, problem_index, name, title)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::VARCHAR(255)[]),
                UNNEST($3::VARCHAR(255)[]),
                UNNEST($4::VARCHAR(255)[]),
                UNNEST($5::VARCHAR(255)[])
            )
            ON CONFLICT DO NOTHING
            ",
        )
        .bind(ids)
        .bind(contest_ids)
        .bind(problem_indexes)
        .bind(names)
        .bind(titles)
        .execute(self)
        .await?;

        Ok(result.rows_affected() as usize)
    }

    async fn load_problems(&self) -> Result<Vec<Problem>> {
        let problems =
            sqlx::query_as("SELECT id, contest_id, problem_index, name, title FROM problems")
                .fetch_all(self)
                .await?;
        Ok(problems)
    }

    async fn load_contests(&self) -> Result<Vec<Contest>> {
        let contests = sqlx::query_as(
            r"
                 SELECT
                    id,
                    start_epoch_second,
                    duration_second,
                    title,
                    rate_change
                 FROM contests
                 ",
        )
        .fetch_all(self)
        .await?;
        Ok(contests)
    }
}
