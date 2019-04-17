use atcoder_problems_sql_common::schema::*;
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
    fn aggregate_great_submissions(&self) -> QueryResult<()>;
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

#[cfg(test)]
mod tests {
    use super::*;
    use atcoder_problems_sql_common::models::{Contest, Submission};
    use atcoder_problems_sql_common::sql::SqlClient;
    use diesel::connection::SimpleConnection;
    use diesel::Connection;
    use diesel::PgConnection;
    use std::collections::HashMap;
    use std::fs::File;
    use std::io::prelude::*;

    const URL: &str = "postgresql://kenkoooo:pass@localhost/test";

    fn read_file(path: &str) -> String {
        let mut file = File::open(path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn setup_test_db() {
        let conn = PgConnection::establish(URL).unwrap();
        let sql = read_file("../config/database-definition.sql");
        conn.batch_execute(&sql).unwrap();
    }

    fn connect_to_test() -> PgConnection {
        PgConnection::establish(URL).expect(
            r"
            Please prepare a database on your localhost with the following properties.
            database:   test
            username:   kenkoooo
            password:   pass
            ",
        )
    }

    #[test]
    fn test_update_accepted_count() {
        setup_test_db();
        let conn = connect_to_test();

        conn.insert_submissions(
            &[
                ("user1", "problem1"),
                ("user1", "problem1"),
                ("user1", "problem2"),
                ("user2", "problem1"),
            ]
            .into_iter()
            .enumerate()
            .map(|(i, (user, problem))| Submission {
                id: i as i64,
                epoch_second: 0,
                problem_id: problem.to_string(),
                contest_id: "".to_string(),
                user_id: user.to_string(),
                language: "".to_string(),
                point: 0.0,
                length: 0,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
        )
        .unwrap();
        conn.update_accepted_count().unwrap();

        let mut v = accepted_count::table
            .select((accepted_count::user_id, accepted_count::problem_count))
            .load::<(String, i32)>(&conn)
            .unwrap();
        v.sort_by_key(|&(_, x)| x);
        assert_eq!(v, vec![("user2".to_string(), 1), ("user1".to_string(), 2)]);
    }

    #[test]
    fn test_update_problem_solver_count() {
        setup_test_db();
        let conn = connect_to_test();

        conn.insert_submissions(
            &[
                ("user1", "problem1"),
                ("user1", "problem1"),
                ("user1", "problem2"),
                ("user2", "problem1"),
            ]
            .into_iter()
            .enumerate()
            .map(|(i, (user, problem))| Submission {
                id: i as i64,
                epoch_second: 0,
                problem_id: problem.to_string(),
                contest_id: "".to_string(),
                user_id: user.to_string(),
                language: "".to_string(),
                point: 0.0,
                length: 0,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
        )
        .unwrap();
        conn.update_problem_solver_count().unwrap();

        let mut v = solver::table
            .select((solver::problem_id, solver::user_count))
            .load::<(String, i32)>(&conn)
            .unwrap();
        v.sort_by_key(|&(_, x)| x);
        assert_eq!(
            v,
            vec![("problem2".to_string(), 1), ("problem1".to_string(), 2)]
        );
    }

    #[test]
    fn test_update_rated_point_sums() {
        setup_test_db();
        let conn = connect_to_test();

        conn.insert_submissions(
            &[
                ("user1", "problem1"),
                ("user1", "problem1"),
                ("user1", "problem2"),
                ("user1", "problem3"),
                ("user2", "problem1"),
            ]
            .into_iter()
            .enumerate()
            .map(|(i, (user, problem))| Submission {
                id: i as i64,
                epoch_second: 0,
                problem_id: problem.to_string(),
                contest_id: "".to_string(),
                user_id: user.to_string(),
                language: "".to_string(),
                point: 0.0,
                length: 0,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
        )
        .unwrap();

        conn.batch_execute(
            r"
        INSERT INTO points (problem_id, point) VALUES
            ('problem1', 100.0),
            ('problem2', 200.0),
            ('problem3', NULL);
        ",
        )
        .unwrap();

        conn.update_rated_point_sums().unwrap();

        let mut v = rated_point_sum::table
            .select((rated_point_sum::user_id, rated_point_sum::point_sum))
            .load::<(String, f64)>(&conn)
            .unwrap();
        v.sort_by_key(|&(_, x)| x as i64);
        assert_eq!(
            v,
            vec![("user2".to_string(), 100.0), ("user1".to_string(), 300.0),]
        );
    }

    #[test]
    fn test_update_language_count() {
        setup_test_db();
        let conn = connect_to_test();

        conn.insert_submissions(
            &[
                ("user1", "problem1", "Perl6 (foo)"),
                ("user1", "problem1", "Perl (baa)"),
                ("user1", "problem2", "Perl"),
                ("user1", "problem3", "Java9 (aaa)"),
                ("user2", "problem1", "Java10 (aaaaa)"),
            ]
            .into_iter()
            .enumerate()
            .map(|(i, (user, problem, language))| Submission {
                id: i as i64,
                epoch_second: 0,
                problem_id: problem.to_string(),
                contest_id: "".to_string(),
                user_id: user.to_string(),
                language: language.to_string(),
                point: 0.0,
                length: 0,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
        )
        .unwrap();
        conn.update_language_count().unwrap();

        let mut v = language_count::table
            .select((
                language_count::user_id,
                language_count::problem_count,
                language_count::simplified_language,
            ))
            .load::<(String, i32, String)>(&conn)
            .unwrap();
        v.sort();
        assert_eq!(
            v,
            vec![
                ("user1".to_owned(), 1, "Java".to_owned()),
                ("user1".to_owned(), 1, "Perl6".to_owned()),
                ("user1".to_owned(), 2, "Perl".to_owned()),
                ("user2".to_owned(), 1, "Java".to_owned())
            ]
        );
    }

    #[test]
    fn test_update_great_submissions() {
        setup_test_db();
        let contest_id = "contest";
        let start_epoch_second = 100;

        let conn = connect_to_test();
        conn.insert_contests(&[Contest {
            id: contest_id.to_owned(),
            start_epoch_second,
            duration_second: 0,
            title: "".to_owned(),
            rate_change: "".to_owned(),
        }])
        .unwrap();

        conn.insert_submissions(
            &[
                (1, "user1", "problem1", 90, start_epoch_second - 10),
                (2, "user2", "problem1", 110, start_epoch_second + 10),
                (3, "user3", "problem1", 100, start_epoch_second + 20),
                (4, "user4", "problem1", 100, start_epoch_second + 30),
            ]
            .into_iter()
            .map(|&(id, user, problem, length, epoch_second)| Submission {
                id,
                epoch_second,
                problem_id: problem.to_string(),
                contest_id: contest_id.to_string(),
                user_id: user.to_string(),
                language: "".to_string(),
                point: 0.0,
                length,
                result: "AC".to_string(),
                execution_time: Some(10),
            })
            .collect::<Vec<_>>(),
        )
        .unwrap();
        conn.update_great_submissions().unwrap();

        let v = shortest::table
            .select((
                shortest::contest_id,
                shortest::problem_id,
                shortest::submission_id,
            ))
            .load::<(String, String, i64)>(&conn)
            .unwrap();
        assert_eq!(v, vec![("contest".to_owned(), "problem1".to_owned(), 3)]);

        conn.aggregate_great_submissions().unwrap();
        let v = shortest_submission_count::table
            .select((
                shortest_submission_count::user_id,
                shortest_submission_count::problem_count,
            ))
            .load::<(String, i32)>(&conn)
            .unwrap();
        assert_eq!(v, vec![("user3".to_owned(), 1)]);
    }

    #[test]
    fn test_update_problem_points() {
        setup_test_db();
        let first_agc_time = 1468670400;

        let conn = connect_to_test();
        conn.insert_contests(&[
            Contest {
                // rated contest
                title: "".to_owned(),
                id: "rated1".to_owned(),
                start_epoch_second: first_agc_time + 100,
                duration_second: 0,
                rate_change: "".to_owned(),
            },
            Contest {
                // unrated contest
                title: "".to_owned(),
                id: "unrated1".to_owned(),
                start_epoch_second: first_agc_time + 100,
                duration_second: 0,
                rate_change: "-".to_owned(),
            },
            Contest {
                // unrated contest
                title: "".to_owned(),
                id: "unrated2".to_owned(),
                start_epoch_second: 0,
                duration_second: 0,
                rate_change: "".to_owned(),
            },
        ])
        .unwrap();

        let submissions = [
            ("problem1", "rated1", 10.0),
            ("problem1", "rated1", 100.0),
            ("problem2", "rated1", 10.0),
            ("problem3", "unrated1", 10.0),
            ("problem1", "unrated2", 10.0),
        ]
        .into_iter()
        .enumerate()
        .map(|(i, &(problem, contest, point))| Submission {
            id: i as i64,
            epoch_second: 0,
            problem_id: problem.to_string(),
            contest_id: contest.to_string(),
            user_id: "".to_string(),
            language: "".to_string(),
            point,
            length: 0,
            result: "AC".to_string(),
            execution_time: Some(10),
        })
        .collect::<Vec<_>>();
        conn.insert_submissions(&submissions).unwrap();
        conn.execute(
            r"INSERT INTO points (problem_id, point, predict) 
                VALUES ('problem0', NULL, 123.4), ('problem1', 500.0, NULL);",
        )
        .unwrap();

        conn.update_problem_points().unwrap();

        let points = points::table
            .select((points::problem_id, (points::point, points::predict)))
            .load::<(String, (Option<f64>, Option<f64>))>(&conn)
            .unwrap()
            .into_iter()
            .collect::<HashMap<_, _>>();

        let mut expected = HashMap::new();
        expected.insert("problem0".to_owned(), (None, Some(123.4)));
        expected.insert("problem1".to_owned(), (Some(100.0), None));
        expected.insert("problem2".to_owned(), (Some(10.0), None));

        assert_eq!(points, expected);
    }
}
