use crate::sql::models::Submission;
use crate::sql::schema::first;
use diesel;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult, Queryable};
use std::collections::BTreeMap;

macro_rules! upsert_info {
    ($table:ident, $values:ident, $conn:ident) => {
        insert_into($table::table)
            .values($values)
            .on_conflict($table::problem_id)
            .do_update()
            .set((
                $table::submission_id.eq(excluded($table::submission_id)),
                $table::contest_id.eq(excluded($table::contest_id)),
            ))
            .execute($conn)
    };
}

pub trait ProblemInfoAggregator {
    fn update_first_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize>;
    fn update_fastest_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize>;
    fn update_shortest_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize>;
}

impl ProblemInfoAggregator for PgConnection {
    fn update_first_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize> {
        #[derive(Debug, Queryable)]
        struct FirstAcceptedRecord {
            problem_id: String,
            contest_id: String,
            submission_id: i64,
        }

        let first: Vec<FirstAcceptedRecord> = first::table.load::<FirstAcceptedRecord>(self)?;
        let mut first_map: BTreeMap<_, _> = first
            .iter()
            .map(|r| (&r.problem_id, (r.submission_id, &r.contest_id, false)))
            .collect();
        for s in ac_submissions.iter() {
            let t = first_map
                .entry(&s.problem_id)
                .or_insert((s.id, &s.contest_id, true));
            if t.0 > s.id {
                *t = (s.id, &s.contest_id, true);
            }
        }

        let values = first_map
            .into_iter()
            .filter(|&(_, (_, _, is_updated))| is_updated)
            .map(|(problem_id, (submission_id, contest_id, _))| {
                (
                    first::problem_id.eq(problem_id),
                    first::contest_id.eq(contest_id),
                    first::submission_id.eq(submission_id),
                )
            })
            .collect::<Vec<_>>();
        upsert_info!(first, values, self)
    }

    fn update_fastest_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize> {
        unimplemented!()
    }

    fn update_shortest_submissions(&self, ac_submissions: &[Submission]) -> QueryResult<usize> {
        unimplemented!()
    }
}
