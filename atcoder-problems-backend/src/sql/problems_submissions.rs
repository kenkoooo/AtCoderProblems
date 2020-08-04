use anyhow::Result;

use diesel::connection::SimpleConnection;
use diesel::PgConnection;

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

pub trait ProblemsSubmissionUpdater {
    fn update_submissions_of_problems(&self) -> Result<()>;
}

impl ProblemsSubmissionUpdater for PgConnection {
    fn update_submissions_of_problems(&self) -> Result<()> {
        self.batch_execute(&generate_query("first", "id"))?;
        self.batch_execute(&generate_query("fastest", "execution_time"))?;
        self.batch_execute(&generate_query("shortest", "length"))?;
        Ok(())
    }
}
