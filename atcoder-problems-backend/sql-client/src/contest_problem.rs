use crate::models::ContestProblem;
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait ContestProblemClient {
    async fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<()>;
    async fn load_contest_problem(&self) -> Result<Vec<ContestProblem>>;
}

#[async_trait]
impl ContestProblemClient for PgPool {
    async fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<()> {
        let contest_ids: Vec<&str> = contest_problems
            .iter()
            .map(|c| c.contest_id.as_str())
            .collect();
        let problem_ids: Vec<&str> = contest_problems
            .iter()
            .map(|c| c.problem_id.as_str())
            .collect();
        let problem_indexes: Vec<&str> = contest_problems
            .iter()
            .map(|c| c.problem_index.as_str())
            .collect();

        sqlx::query(
            r"
            INSERT INTO contest_problem (contest_id, problem_id, problem_index)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::VARCHAR(255)[]),
                UNNEST($3::VARCHAR(255)[])
            )
            ON CONFLICT DO NOTHING
            ",
        )
        .bind(contest_ids)
        .bind(problem_ids)
        .bind(problem_indexes)
        .execute(self)
        .await?;

        Ok(())
    }

    async fn load_contest_problem(&self) -> Result<Vec<ContestProblem>> {
        let problems =
            sqlx::query_as("SELECT contest_id, problem_id, problem_index FROM contest_problem")
                .fetch_all(self)
                .await?;

        Ok(problems)
    }
}
