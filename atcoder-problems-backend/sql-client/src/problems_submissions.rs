use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use futures::try_join;

#[async_trait]
pub trait ProblemsSubmissionUpdater {
    async fn update_submissions_of_problems(&self) -> Result<()>;
}

#[async_trait]
impl ProblemsSubmissionUpdater for PgPool {
    async fn update_submissions_of_problems(&self) -> Result<()> {
        let first_sql = generate_query("first", "id");
        let fastest_sql = generate_query("fastest", "execution_time");
        let shortest_sql = generate_query("shortest", "length");

        try_join!(
            sqlx::query(&first_sql).execute(self),
            sqlx::query(&fastest_sql).execute(self),
            sqlx::query(&shortest_sql).execute(self),
        )?;

        Ok(())
    }
}

fn generate_query(table: &str, column: &str) -> String {
    format!(
        r"
                INSERT INTO {table}
                (submission_id, problem_id, contest_id)
                SELECT id, problem_id, contest_id FROM submissions
                WHERE id IN
                (
                    SELECT MIN(submissions.id) FROM submissions
                    LEFT JOIN contests ON contests.id=contest_id
                    WHERE result='AC'
                    AND contests.start_epoch_second < submissions.epoch_second
                    AND (problem_id, submissions.{column}) IN
                    (
                        SELECT problem_id, MIN(submissions.{column}) FROM submissions
                        LEFT JOIN contests ON contests.id=contest_id
                        WHERE result='AC'
                        AND contests.start_epoch_second < submissions.epoch_second
                        GROUP BY problem_id
                    )
                    GROUP BY problem_id
                )
                ON CONFLICT (problem_id)
                DO UPDATE SET
                        contest_id=EXCLUDED.contest_id,
                        problem_id=EXCLUDED.problem_id,
                        submission_id=EXCLUDED.submission_id;",
        table = table,
        column = column
    )
}
