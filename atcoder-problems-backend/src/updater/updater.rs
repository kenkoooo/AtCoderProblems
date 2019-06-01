use crate::sql::schema::*;
use diesel::connection::SimpleConnection;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use regex::Regex;
use std::collections::{BTreeMap, BTreeSet};
use std::i32::MAX;

pub trait SqlUpdater {
    fn update_accepted_count(&self) -> QueryResult<()>;
    fn update_problem_solver_count(&self) -> QueryResult<()>;
    fn update_rated_point_sums(&self) -> QueryResult<()>;
    fn update_language_count(&self) -> QueryResult<()>;
    fn update_great_submissions(&self) -> QueryResult<()>;
    fn update_problem_points(&self) -> QueryResult<()>;
}

impl SqlUpdater for PgConnection {
    fn update_accepted_count(&self) -> QueryResult<()> {
        accepted_count::table
            .select((accepted_count::user_id, accepted_count::problem_count))
            .load::<(String, i32)>(self)
            .and_then(|current_count| {
                submissions::table
                    .filter(submissions::result.eq("AC"))
                    .select((submissions::user_id, submissions::problem_id))
                    .load::<(String, String)>(self)
                    .map(|submission| (submission, current_count))
            })
            .and_then(|(submissions, current_count)| {
                let current_set = current_count
                    .iter()
                    .map(|(user_id, count)| (user_id.as_str(), *count))
                    .collect::<BTreeSet<(&str, i32)>>();
                let mut map: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
                for (user_id, problem_id) in submissions.iter() {
                    map.entry(user_id)
                        .or_insert_with(BTreeSet::new)
                        .insert(problem_id);
                }
                let user_count = map
                    .into_iter()
                    .map(|(user_id, set)| (user_id, set.len() as i32))
                    .filter(|t| !current_set.contains(t))
                    .map(|(user_id, count)| {
                        (
                            accepted_count::user_id.eq(user_id),
                            accepted_count::problem_count.eq(count),
                        )
                    })
                    .collect::<Vec<_>>();
                insert_into(accepted_count::table)
                    .values(&user_count)
                    .on_conflict(accepted_count::user_id)
                    .do_update()
                    .set(accepted_count::problem_count.eq(excluded(accepted_count::problem_count)))
                    .execute(self)
            })
            .map(|_| ())
    }
    fn update_problem_solver_count(&self) -> QueryResult<()> {
        self.batch_execute(
            r"
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
                problem_id ON CONFLICT (problem_id) DO
            UPDATE
            SET
                user_count = EXCLUDED.user_count;
            ",
        )
    }

    fn update_rated_point_sums(&self) -> QueryResult<()> {
        rated_point_sum::table
            .select((rated_point_sum::point_sum, rated_point_sum::user_id))
            .load::<(f64, String)>(self)
            .and_then(|current_sum| {
                submissions::table
                    .inner_join(points::table.on(submissions::problem_id.eq(points::problem_id)))
                    .filter(submissions::result.eq("AC"))
                    .filter(points::point.is_not_null())
                    .select((submissions::user_id, submissions::problem_id, points::point))
                    .load::<(String, String, Option<f64>)>(self)
                    .map(|submissions| (submissions, current_sum))
            })
            .and_then(|(submissions, current_sum)| {
                let current_set = current_sum
                    .iter()
                    .map(|(point, user_id)| (user_id.as_str(), *point as i64))
                    .collect::<BTreeSet<_>>();
                let mut user_map: BTreeMap<&str, BTreeSet<(&str, i64)>> = BTreeMap::new();
                for (user_id, problem_id, point) in submissions.iter() {
                    let point = point.unwrap() as i64;
                    user_map
                        .entry(user_id)
                        .or_insert_with(BTreeSet::new)
                        .insert((problem_id, point));
                }
                let insert_data = user_map
                    .into_iter()
                    .map(|(user_id, set)| {
                        (
                            user_id,
                            set.into_iter().map(|(_, point)| point).sum::<i64>(),
                        )
                    })
                    .filter(|t| !current_set.contains(t))
                    .map(|(user_id, sum)| {
                        (
                            rated_point_sum::user_id.eq(user_id),
                            rated_point_sum::point_sum.eq(sum as f64),
                        )
                    })
                    .collect::<Vec<_>>();
                insert_into(rated_point_sum::table)
                    .values(&insert_data)
                    .on_conflict(rated_point_sum::user_id)
                    .do_update()
                    .set(rated_point_sum::point_sum.eq(excluded(rated_point_sum::point_sum)))
                    .execute(self)
            })
            .map(|_| ())
    }

    fn update_language_count(&self) -> QueryResult<()> {
        let re = Regex::new(r"\d* \(.*\)").unwrap();
        language_count::table
            .select((
                language_count::user_id,
                language_count::simplified_language,
                language_count::problem_count,
            ))
            .load::<(String, String, i32)>(self)
            .and_then(|current_count| {
                submissions::table
                    .filter(submissions::result.eq("AC"))
                    .select((
                        submissions::user_id,
                        submissions::problem_id,
                        submissions::language,
                    ))
                    .load::<(String, String, String)>(self)
                    .map(|submissions| {
                        let submissions = submissions
                            .into_iter()
                            .map(|(user_id, problem_id, language)| {
                                let simplified_language =
                                    if language.len() >= 5 && &language[..5] == "Perl6" {
                                        "Perl6".to_string()
                                    } else {
                                        re.replace(&language, "").to_string()
                                    };
                                (user_id, problem_id, simplified_language)
                            })
                            .collect::<Vec<_>>();
                        (submissions, current_count)
                    })
            })
            .and_then(|(submissions, current_count)| {
                let current_set: BTreeSet<(&str, &str, i32)> = current_count
                    .iter()
                    .map(|(user_id, language, count)| (user_id.as_str(), language.as_str(), *count))
                    .collect::<BTreeSet<_>>();
                let mut user_map: BTreeMap<(&str, &str), BTreeSet<&str>> = BTreeMap::new();
                for (user_id, problem_id, language) in submissions.iter() {
                    user_map
                        .entry((user_id, language))
                        .or_insert_with(BTreeSet::new)
                        .insert(problem_id);
                }

                let insert_data = user_map
                    .into_iter()
                    .map(|((user_id, language), set)| (user_id, language, set.len() as i32))
                    .filter(|t| !current_set.contains(t))
                    .map(|(user_id, language, count)| {
                        (
                            language_count::user_id.eq(user_id),
                            language_count::simplified_language.eq(language),
                            language_count::problem_count.eq(count),
                        )
                    })
                    .collect::<Vec<_>>();

                insert_into(language_count::table)
                    .values(&insert_data)
                    .on_conflict((language_count::user_id, language_count::simplified_language))
                    .do_update()
                    .set(language_count::problem_count.eq(excluded(language_count::problem_count)))
                    .execute(self)
                    .map(|_| ())
            })
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
