use crate::error::Result;
use diesel::connection::SimpleConnection;
use diesel::PgConnection;

pub trait ProblemInfoUpdater {
    fn update_solver_count(&self) -> Result<()>;
    fn update_problem_points(&self) -> Result<()>;
}

impl ProblemInfoUpdater for PgConnection {
    fn update_solver_count(&self) -> Result<()> {
        self.batch_execute(
            r"
                INSERT INTO solver (user_count, problem_id)
                    SELECT COUNT(DISTINCT(user_id)), problem_id
                    FROM submissions
                    WHERE result = 'AC'
                    GROUP BY problem_id
                ON CONFLICT (problem_id) DO UPDATE
                SET user_count = EXCLUDED.user_count;
            ",
        )?;
        Ok(())
    }

    fn update_problem_points(&self) -> Result<()> {
        self.batch_execute(
            r"
                INSERT INTO points (problem_id, point)
                    SELECT submissions.problem_id, MAX(submissions.point)
                    FROM submissions
                    INNER JOIN contests ON contests.id = submissions.contest_id
                    WHERE contests.start_epoch_second >= 1468670400
                    AND contests.rate_change != '-'
                    GROUP BY submissions.problem_id
                ON CONFLICT (problem_id) DO UPDATE
                SET point = EXCLUDED.point;
            ",
        )?;
        Ok(())
    }
}
