use crate::schema::*;
use diesel::connection::SimpleConnection;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use std::collections::BTreeMap;
use std::i32::MAX;

pub trait SqlUpdater {
    fn update_accepted_count(&self) -> QueryResult<()>;
    fn update_problem_solver_count(&self) -> QueryResult<()>;
    fn update_rated_point_sums(&self) -> QueryResult<()>;
    fn update_language_count(&self) -> QueryResult<()>;
    fn update_great_submissions(&self) -> QueryResult<()>;
    fn aggregate_great_submissions(&self) -> QueryResult<()>;
    fn update_problem_points(&self) -> QueryResult<()>;
}

impl SqlUpdater for PgConnection {
    fn update_accepted_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
            DELETE FROM
                accepted_count;
            INSERT INTO
                accepted_count (user_id, problem_count)
            SELECT
                user_id,
                COUNT(DISTINCT(problem_id))
            FROM
                submissions
            WHERE
                result = 'AC'
            GROUP BY
                user_id;
            ",
        )
    }
    fn update_problem_solver_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
            DELETE FROM
                solver;
            INSERT INTO
                solver (user_count, problem_id)
            SELECT
                COUNT(DISTINCT(user_id)),
                problem_id
            FROM
                submissions
            WHERE
                result = 'AC'
            GROUP BY
                problem_id;
            ",
        )
    }

    fn update_rated_point_sums(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
            DELETE FROM
                rated_point_sum;
            INSERT INTO
                rated_point_sum (point_sum, user_id)
            SELECT
                SUM(point),
                user_id
            FROM
                (
                    SELECT
                        DISTINCT(submissions.user_id, submissions.problem_id),
                        points.point,
                        submissions.user_id
                    FROM
                        submissions
                        JOIN points ON points.problem_id = submissions.problem_id
                    WHERE
                        result = 'AC'
                        AND points.point IS NOT NULL
                        AND submissions.user_id NOT LIKE 'vjudge_'
                ) AS sub
            GROUP BY
                user_id;
        ",
        )
    }

    fn update_language_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
                DELETE FROM
                    language_count;
                INSERT INTO
                    language_count (user_id, simplified_language, problem_count)
                SELECT
                    user_id,
                    simplified_language,
                    COUNT(DISTINCT(problem_id))
                FROM
                    (
                        SELECT
                            regexp_replace(language, '((?<!Perl)\d*|) \(.*\)', '') AS simplified_language,
                            user_id,
                            problem_id
                        FROM
                            submissions
                        WHERE
                            result = 'AC'
                    ) AS sub
                GROUP BY
                    (simplified_language, user_id);
                ",
        )
    }

    fn update_great_submissions(&self) -> QueryResult<()> {
        submissions::table
            .inner_join(contests::table.on(contests::id.eq(submissions::contest_id)))
            .filter(submissions::result.eq("AC"))
            .filter(submissions::epoch_second.gt(contests::start_epoch_second))
            .select((
                submissions::id,
                submissions::problem_id,
                submissions::contest_id,
                submissions::execution_time,
                submissions::length,
            ))
            .load::<(i64, String, String, Option<i32>, i32)>(self)
            .and_then(|mut submissions| {
                submissions.sort_by_key(|s| s.0);
                let mut first_map: BTreeMap<&str, (&str, i64)> = BTreeMap::new();
                let mut fastest_map: BTreeMap<&str, (&str, i64, i32)> = BTreeMap::new();
                let mut shortest_map: BTreeMap<&str, (&str, i64, i32)> = BTreeMap::new();
                for (id, problem_id, contest_id, execution_time, length) in submissions.iter() {
                    if !first_map.contains_key(problem_id.as_str()) {
                        first_map.insert(problem_id, (contest_id, *id));
                    }
                    if let Some(execution_time) = execution_time {
                        let fastest = fastest_map
                            .entry(problem_id)
                            .or_insert((contest_id, 0, MAX));
                        if fastest.2 > *execution_time {
                            fastest.0 = contest_id;
                            fastest.1 = *id;
                            fastest.2 = *execution_time;
                        }
                    }
                    let shortest = shortest_map
                        .entry(problem_id)
                        .or_insert((contest_id, 0, MAX));
                    if shortest.2 > *length {
                        shortest.0 = contest_id;
                        shortest.1 = *id;
                        shortest.2 = *length;
                    }
                }

                let first_insert = first_map
                    .into_iter()
                    .map(|(problem_id, (contest_id, submission_id))| {
                        (
                            first::submission_id.eq(submission_id),
                            first::problem_id.eq(problem_id),
                            first::contest_id.eq(contest_id),
                        )
                    })
                    .collect::<Vec<_>>();
                insert_into(first::table)
                    .values(&first_insert)
                    .on_conflict(first::problem_id)
                    .do_update()
                    .set((
                        first::submission_id.eq(excluded(first::submission_id)),
                        first::contest_id.eq(excluded(first::contest_id)),
                    ))
                    .execute(self)?;

                let shortest_insert = shortest_map
                    .into_iter()
                    .map(|(problem_id, (contest_id, submission_id, _))| {
                        (
                            shortest::submission_id.eq(submission_id),
                            shortest::problem_id.eq(problem_id),
                            shortest::contest_id.eq(contest_id),
                        )
                    })
                    .collect::<Vec<_>>();
                insert_into(shortest::table)
                    .values(&shortest_insert)
                    .on_conflict(shortest::problem_id)
                    .do_update()
                    .set((
                        shortest::submission_id.eq(excluded(shortest::submission_id)),
                        shortest::contest_id.eq(excluded(shortest::contest_id)),
                    ))
                    .execute(self)?;

                let fastest_insert = fastest_map
                    .into_iter()
                    .map(|(problem_id, (contest_id, submission_id, _))| {
                        (
                            fastest::submission_id.eq(submission_id),
                            fastest::problem_id.eq(problem_id),
                            fastest::contest_id.eq(contest_id),
                        )
                    })
                    .collect::<Vec<_>>();
                insert_into(fastest::table)
                    .values(&fastest_insert)
                    .on_conflict(fastest::problem_id)
                    .do_update()
                    .set((
                        fastest::submission_id.eq(excluded(fastest::submission_id)),
                        fastest::contest_id.eq(excluded(fastest::contest_id)),
                    ))
                    .execute(self)?;
                Ok(())
            })
    }

    fn aggregate_great_submissions(&self) -> QueryResult<()> {
        for (table, parent) in [
            ("first_submission_count", "first"),
            ("shortest_submission_count", "shortest"),
            ("fastest_submission_count", "fastest"),
        ]
        .into_iter()
        {
            self.batch_execute(&format!(
                r"
                DELETE FROM
                    {table};
                INSERT INTO
                    {table} (problem_count, user_id)
                SELECT
                    COUNT(DISTINCT({parent}.problem_id)),
                    user_id
                FROM
                    {parent}
                    JOIN submissions ON submissions.id = {parent}.submission_id
                GROUP BY
                    submissions.user_id;
                ",
                table = table,
                parent = parent
            ))?
        }
        Ok(())
    }

    fn update_problem_points(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
                DELETE FROM
                    points
                WHERE
                    point IS NOT NULL;
                INSERT INTO
                    points (problem_id, point)
                SELECT
                    submissions.problem_id,
                    MAX(submissions.point)
                FROM
                    submissions
                    INNER JOIN contests ON contests.id = submissions.contest_id
                WHERE
                    contests.start_epoch_second >= 1468670400
                    AND contests.rate_change != '-'
                GROUP BY
                    submissions.problem_id;
            ",
        )
    }
}
