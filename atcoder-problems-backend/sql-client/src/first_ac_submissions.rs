use crate::models::Submission;
use crate::PgPool;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait FirstAcSubmissionUpdater {
    async fn update_first_ac_of_problems<'a, I: Iterator<Item = &'a Submission> + std::marker::Send>(
        &self,
        first_ac_submissions: I,
    ) -> Result<()>;
}

#[async_trait]
impl FirstAcSubmissionUpdater for PgPool {
    async fn update_first_ac_of_problems<'a, I: Iterator<Item = &'a Submission> + std::marker::Send> (
        &self,
        first_ac_submissions: I,
    ) -> Result<()> {
        let (ids, problem_ids, contest_ids) = first_ac_submissions.fold(
            (vec![], vec![], vec![]),
            |(mut ids, mut problem_ids, mut contest_ids), cur| {
                ids.push(cur.id);
                problem_ids.push(cur.problem_id.clone());
                contest_ids.push(cur.contest_id.clone());
                (ids, problem_ids, contest_ids)
            },
        );

        sqlx::query(
            r"
        INSERT INTO first
        (submission_id, problem_id, contest_id)
        VALUES (
            UNNEST($1),
            UNNEST($2::VARCHAR(255)[]),
            UNNEST($3::VARCHAR(255)[])
        )
        ON CONFLICT (problem_id)
        DO UPDATE SET
                contest_id=EXCLUDED.contest_id,
                problem_id=EXCLUDED.problem_id,
                submission_id=EXCLUDED.submission_id;",
        )
            .bind(ids)
            .bind(problem_ids)
            .bind(contest_ids)
            .execute(self)
            .await?;
        Ok(())
    }
}
