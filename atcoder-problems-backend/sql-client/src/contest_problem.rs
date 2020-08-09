use crate::models::ContestProblem;
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use sqlx::postgres::PgRow;
use sqlx::Row;

#[async_trait]
pub trait ContestProblemClient {
    async fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<()>;
    async fn load_contest_problem(&self) -> Result<Vec<ContestProblem>>;
}

#[async_trait]
impl ContestProblemClient for PgPool {
    async fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<()> {
        let (contest_ids, problem_ids): (Vec<&str>, Vec<&str>) = contest_problems
            .iter()
            .map(|c| (c.contest_id.as_str(), c.problem_id.as_str()))
            .unzip();

        sqlx::query(
            r"
            INSERT INTO contest_problem (contest_id, problem_id)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::VARCHAR(255)[])
            )
            ON CONFLICT DO NOTHING
            ",
        )
        .bind(contest_ids)
        .bind(problem_ids)
        .execute(self)
        .await?;

        Ok(())
    }

    async fn load_contest_problem(&self) -> Result<Vec<ContestProblem>> {
        let problems = sqlx::query("SELECT contest_id, problem_id FROM contest_problem")
            .try_map(|row: PgRow| {
                let contest_id: String = row.try_get("contest_id")?;
                let problem_id: String = row.try_get("problem_id")?;
                Ok(ContestProblem {
                    contest_id,
                    problem_id,
                })
            })
            .fetch_all(self)
            .await?;

        Ok(problems)
    }
}
