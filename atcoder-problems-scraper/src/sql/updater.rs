use diesel::PgConnection;
use diesel::{connection::SimpleConnection, QueryResult};

pub trait SqlUpdater {
    fn update_accepted_count(&self) -> QueryResult<()>;
    fn update_problem_solver_count(&self) -> QueryResult<()>;
    fn update_rated_point_sums(&self) -> QueryResult<()>;
    fn update_language_count(&self) -> QueryResult<()>;
    fn update_great_submissions(&self) -> QueryResult<()>;
    fn aggregate_great_submissions(&self) -> QueryResult<()>;
}

impl SqlUpdater for PgConnection {
    fn update_accepted_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
    DELETE FROM accepted_count;
    INSERT INTO accepted_count (user_id, problem_count)
    SELECT user_id, count(distinct(problem_id)) FROM submissions WHERE result='AC'
    GROUP BY user_id;
            ",
        )
    }
    fn update_problem_solver_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
    DELETE FROM solver;
    INSERT INTO solver (user_count, problem_id)
    SELECT COUNT(DISTINCT(user_id)), problem_id FROM submissions WHERE result='AC'
    GROUP BY problem_id;
            ",
        )
    }

    fn update_rated_point_sums(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
    DELETE FROM rated_point_sum;
    INSERT INTO rated_point_sum (point_sum, user_id)
    SELECT SUM(point), user_id FROM (
        SELECT DISTINCT(submissions.user_id, submissions.problem_id), points.point, submissions.user_id FROM submissions
        JOIN points ON points.problem_id=submissions.problem_id
        WHERE result='AC'
        AND points.point IS NOT NULL
        AND submissions.user_id NOT LIKE 'vjudge_' 
    ) AS sub GROUP BY user_id;        
        ")
    }

    fn update_language_count(&self) -> QueryResult<()> {
        self.batch_execute(r"
    DELETE FROM language_count;
    INSERT INTO language_count (user_id, simplified_language, problem_count)
    SELECT user_id, simplified_language, COUNT(DISTINCT(problem_id)) FROM (
        SELECT regexp_replace(language, '((?<!Perl)\d*|) \(.*\)', '') AS simplified_language, user_id, problem_id
        FROM submissions WHERE result='AC'
    ) AS sub GROUP BY (simplified_language, user_id);
                ")
    }

    fn update_great_submissions(&self) -> QueryResult<()> {
        let pairs = [
            ("first", "epoch_second"),
            ("fastest", "execution_time"),
            ("shortest", "length"),
        ];
        for (table, column) in pairs.into_iter() {
            self.batch_execute(&format!(
                r"
                DELETE FROM {table};
                INSERT INTO {table} (contest_id, problem_id, submission_id)
                SELECT contest_id, problem_id, submissions.id FROM submissions
                WHERE
                    CONCAT(problem_id, ' ', submissions.id)
                    IN (
                        SELECT CONCAT(problem_id, ' ', MIN(submissions.id))
                        FROM submissions
                        JOIN contests
                        ON contests.id=contest_id
                        WHERE
                            CONCAT(problem_id, ' ', {column})
                            IN (
                                SELECT CONCAT(problem_id, ' ', MIN({column}))
                                FROM submissions
                                JOIN contests ON contests.id=contest_id
                                WHERE result='AC'
                                AND
                                submissions.epoch_second > contests.start_epoch_second
                                GROUP BY problem_id
                            )
                            AND
                            result='AC'
                            AND
                            submissions.epoch_second > contests.start_epoch_second
                            GROUP BY problem_id
                    )
                    AND
                    result='AC';
                    ",
                table = table,
                column = column
            ))?
        }
        Ok(())
    }

    fn aggregate_great_submissions(&self) -> QueryResult<()> {
        for (table, parent) in [
            ("first_submission_count", "first"),
            ("shortest_submission_count", "shortest"),
            ("fastest_submission_count", "fastest"),
        ]
        .iter()
        {
            self.batch_execute(&format!(
                r"
                    DELETE FROM {table};
                    INSERT INTO {table} (problem_count, user_id)
                    SELECT COUNT(DISTINCT({parent}.problem_id)), user_id FROM {parent}
                    JOIN submissions ON submissions.id={parent}.submission_id
                    GROUP BY submissions.user_id;
                ",
                table = table,
                parent = parent
            ))?
        }
        Ok(())
    }
}
