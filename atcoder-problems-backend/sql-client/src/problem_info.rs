use crate::{PgPool, FIRST_AGC_EPOCH_SECOND};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait ProblemInfoUpdater {
    async fn update_solver_count(&self) -> Result<()>;
    async fn update_problem_points(&self) -> Result<()>;
}

#[async_trait]
impl ProblemInfoUpdater for PgPool {
    async fn update_solver_count(&self) -> Result<()> {
        sqlx::query(
            r"
                INSERT INTO solver (user_count, problem_id)
                    SELECT COUNT(DISTINCT(user_id)), problem_id
                    FROM submissions
                    WHERE result = 'AC'
                    GROUP BY problem_id
                ON CONFLICT (problem_id) DO UPDATE
                SET user_count = EXCLUDED.user_count;
            ",
        )
        .execute(self)
        .await?;
        Ok(())
    }

    async fn update_problem_points(&self) -> Result<()> {
        sqlx::query(
            r"
                INSERT INTO points (problem_id, point)
                    SELECT submissions.problem_id, MAX(submissions.point)
                    FROM submissions
                    INNER JOIN contests ON contests.id = submissions.contest_id
                    WHERE contests.start_epoch_second >= $1
                    AND contests.rate_change != '-'
                    GROUP BY submissions.problem_id
                ON CONFLICT (problem_id) DO UPDATE
                SET point = EXCLUDED.point;
            ",
        )
        .bind(FIRST_AGC_EPOCH_SECOND)
        .execute(self)
        .await?;
        Ok(())
    }
}
