use crate::models::Submission;
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;

#[async_trait]
pub trait FirstAcSubmissionUpdater {
    async fn update_first_ac_of_problems(
        &self,
        first_ac_submissions: &HashMap<String, Submission>,
    ) -> Result<()>;
}

#[async_trait]
impl FirstAcSubmissionUpdater for PgPool {
    async fn update_first_ac_of_problems(
        &self,
        first_ac_submissions: &HashMap<String, Submission>,
    ) -> Result<()> {
        for submission in first_ac_submissions.values() {
            let first_query = generate_query(submission);
            sqlx::query(&first_query).execute(self).await?;
        }
        Ok(())
    }
}

fn generate_query(submission: &Submission) -> String {
    format!(
        r"
                INSERT INTO first
                (submission_id, problem_id, contest_id) VALUES
                ({submission_id}, '{problem_id}', '{contest_id}')
                ON CONFLICT (problem_id)
                DO UPDATE SET
                        contest_id=EXCLUDED.contest_id,
                        problem_id=EXCLUDED.problem_id,
                        submission_id=EXCLUDED.submission_id;",
        submission_id = submission.id,
        problem_id = submission.problem_id,
        contest_id = submission.contest_id
    )
}


