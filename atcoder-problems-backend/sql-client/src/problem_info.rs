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

    /// 各問題の点数を計算して更新する。
    ///
    /// ある問題への提出のうち、 __コンテスト開始後の提出__ における最も大きい得点がその問題の点数となる。
    ///
    /// コンテスト開始前、writerなどが仮の点数が付けられている問題をACすることがあり、
    /// 仮の点数がコンテストでの正式な点数より大きかった場合には、仮の点数がAtCoder Problemsでの正式な点数とされてしまう。
    /// これを防ぐために、コンテスト開始前の提出は点数計算で考慮しないようにしている。
    ///
    /// 「コンテスト開始前にwriterがACしているが、コンテスト開始以降に一人もACできていない」場合は点数が
    /// 計算されないという問題があるが、現時点ではその問題は発生していないため対応は保留されている。
    async fn update_problem_points(&self) -> Result<()> {
        sqlx::query(
            r"
                INSERT INTO points (problem_id, point)
                    SELECT submissions.problem_id, MAX(submissions.point)
                    FROM submissions
                    INNER JOIN contests ON contests.id = submissions.contest_id
                    WHERE contests.start_epoch_second >= $1
                    AND submissions.epoch_second >= contests.start_epoch_second
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
