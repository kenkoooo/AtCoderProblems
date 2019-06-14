use crate::sql::models::Submission;
use crate::sql::schema::{fastest, first, shortest, submissions};
use diesel;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use log::info;
use std::collections::BTreeMap;
use std::iter::Iterator;

macro_rules! load_records {
    ($table:ident, $conn:ident, $column:ident: $t:tt) => {
        $table::table
            .select($table::submission_id)
            .load::<i64>($conn)
            .and_then(|ids| {
                submissions::table
                    .filter(submissions::id.eq_any(ids))
                    .select((
                        submissions::problem_id,
                        submissions::contest_id,
                        submissions::id,
                        submissions::$column,
                    ))
                    .load::<(String, String, i64, $t)>($conn)
            })
    };
}

macro_rules! upsert_values {
    ($table:ident, $values:ident, $conn:ident) => {
        insert_into($table::table)
            .values(
                $values
                    .into_iter()
                    .map(|(problem_id, contest_id, submission_id)| {
                        (
                            $table::problem_id.eq(problem_id),
                            $table::contest_id.eq(contest_id),
                            $table::submission_id.eq(submission_id),
                        )
                    })
                    .collect::<Vec<_>>(),
            )
            .on_conflict($table::problem_id)
            .do_update()
            .set((
                $table::submission_id.eq(excluded($table::submission_id)),
                $table::contest_id.eq(excluded($table::contest_id)),
            ))
            .execute($conn)
    };
}

pub trait ProblemsSubmissionUpdater {
    fn update_submissions_of_problems(&self, ac_submissions: &[Submission]) -> QueryResult<usize>;
}

impl ProblemsSubmissionUpdater for PgConnection {
    fn update_submissions_of_problems(&self, ac_submissions: &[Submission]) -> QueryResult<usize> {
        info!("Updating shortest submissions...");
        update_shortest_submissions(self, ac_submissions)?;

        info!("Updating first submissions...");
        update_first_submissions(self, ac_submissions)?;

        info!("Updating fastest submissions...");
        update_fastest_submissions(self, ac_submissions)
    }
}

fn update_first_submissions(
    conn: &PgConnection,
    ac_submissions: &[Submission],
) -> QueryResult<usize> {
    let records = load_records!(first, conn, id: i64)?;
    let values = update_aggregation(&records, ac_submissions.iter(), |s| s.id);
    upsert_values!(first, values, conn)
}

fn update_fastest_submissions(
    conn: &PgConnection,
    ac_submissions: &[Submission],
) -> QueryResult<usize> {
    type Opi32 = Option<i32>;
    let records = load_records!(fastest, conn, execution_time: Opi32)?
        .into_iter()
        .filter_map(|(problem_id, contest_id, id, execution_time)| {
            execution_time.map(|time| (problem_id, contest_id, id, time))
        })
        .collect::<Vec<_>>();
    let values = update_aggregation(
        &records,
        ac_submissions.iter().filter(|s| s.execution_time.is_some()),
        |s| s.execution_time.unwrap(),
    );
    upsert_values!(fastest, values, conn)
}

fn update_shortest_submissions(
    conn: &PgConnection,
    ac_submissions: &[Submission],
) -> QueryResult<usize> {
    let records = load_records!(shortest, conn, length: i32)?;
    let values = update_aggregation(&records, ac_submissions.iter(), |s| s.length);
    upsert_values!(shortest, values, conn)
}

fn update_aggregation<'a, T, F, I>(
    values: &'a [(String, String, i64, T)],
    iter: I,
    submission_mapper: F,
) -> Vec<(&'a str, &'a str, i64)>
where
    T: Copy + PartialEq + PartialOrd + std::fmt::Debug,
    F: Fn(&Submission) -> T,
    I: Iterator<Item = &'a Submission>,
{
    #[derive(Debug)]
    struct CompetitiveRecord<'a, T> {
        contest_id: &'a str,
        target: T,
        submission_id: i64,
        is_updated: bool,
    }

    let submissions: Vec<_> = iter
        .map(|submission| {
            (
                submission.problem_id.as_str(),
                CompetitiveRecord {
                    contest_id: &submission.contest_id,
                    submission_id: submission.id,
                    target: submission_mapper(submission),
                    is_updated: true,
                },
            )
        })
        .collect();

    let mut map = values
        .iter()
        .map(|(problem_id, contest_id, id, target)| {
            (
                problem_id.as_str(),
                CompetitiveRecord {
                    contest_id,
                    submission_id: *id,
                    target: *target,
                    is_updated: false,
                },
            )
        })
        .collect::<BTreeMap<&str, CompetitiveRecord<'_, T>>>();
    for (problem_id, record) in submissions.into_iter() {
        match map.get_mut(problem_id) {
            Some(current) => {
                if current.target > record.target
                    || (current.target == record.target
                        && current.submission_id > record.submission_id)
                {
                    *current = record;
                }
            }
            None => {
                map.insert(problem_id, record);
            }
        }
    }

    map.into_iter()
        .filter(|(_, record)| record.is_updated)
        .map(|(problem_id, record)| (problem_id, record.contest_id, record.submission_id))
        .collect()
}
