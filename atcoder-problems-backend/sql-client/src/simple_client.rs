use crate::models::{Contest, Problem};
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use sqlx::postgres::PgRow;
use sqlx::Row;

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
                    ids.push(cur.id.clone());
                    start_epoch_seconds.push(cur.start_epoch_second);
                    duration_seconds.push(cur.duration_second);
                    titles.push(cur.title.clone());
                    rate_changes.push(cur.rate_change.clone());
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
        let (ids, contest_ids, titles) = values.iter().fold(
            (vec![], vec![], vec![]),
            |(mut ids, mut contest_ids, mut titles), cur| {
                ids.push(cur.id.clone());
                contest_ids.push(cur.contest_id.clone());
                titles.push(cur.title.clone());
                (ids, contest_ids, titles)
            },
        );

        let result = sqlx::query(
            r"
            INSERT INTO problems
            (id, contest_id, title)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::VARCHAR(255)[]),
                UNNEST($3::VARCHAR(255)[])
            )
            ON CONFLICT DO NOTHING
            ",
        )
        .bind(ids)
        .bind(contest_ids)
        .bind(titles)
        .execute(self)
        .await?;

        Ok(result.rows_affected() as usize)
    }

    async fn load_problems(&self) -> Result<Vec<Problem>> {
        let problems = sqlx::query("SELECT id, contest_id, title FROM problems")
            .try_map(|row: PgRow| {
                let id: String = row.try_get("id")?;
                let contest_id: String = row.try_get("contest_id")?;
                let title: String = row.try_get("title")?;
                Ok(Problem {
                    id,
                    contest_id,
                    title,
                })
            })
            .fetch_all(self)
            .await?;
        Ok(problems)
    }

    async fn load_contests(&self) -> Result<Vec<Contest>> {
        let contests = sqlx::query(
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
        .try_map(|row: PgRow| {
            let id: String = row.try_get("id")?;
            let start_epoch_second: i64 = row.try_get("start_epoch_second")?;
            let duration_second: i64 = row.try_get("duration_second")?;
            let title: String = row.try_get("title")?;
            let rate_change: String = row.try_get("rate_change")?;
            Ok(Contest {
                id,
                start_epoch_second,
                duration_second,
                title,
                rate_change,
            })
        })
        .fetch_all(self)
        .await?;
        Ok(contests)
    }
}
