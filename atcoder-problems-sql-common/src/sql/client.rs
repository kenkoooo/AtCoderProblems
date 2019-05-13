use crate::models::*;
use crate::schema::*;
use crate::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};

use diesel::dsl::insert_into;
use diesel::pg::upsert::excluded;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::QueryResult;

pub trait SqlClient {
    fn insert_submissions(&self, values: &[Submission]) -> Result<usize, String>;
    fn insert_contests(&self, values: &[Contest]) -> Result<usize, String>;
    fn insert_problems(&self, values: &[Problem]) -> Result<usize, String>;
    fn insert_contest_problem_pair(
        &self,
        contest_problem_pairs: &[(&str, &str)],
    ) -> QueryResult<usize>;
    fn insert_performances(&self, performances: &[Performance]) -> QueryResult<usize>;

    fn get_problems(&self) -> Result<Vec<Problem>, String>;
    fn get_contests(&self) -> Result<Vec<Contest>, String>;
    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String>;
    fn get_contests_without_performances(&self) -> QueryResult<Vec<String>>;
}

impl SqlClient for PgConnection {
    fn insert_submissions(&self, values: &[Submission]) -> Result<usize, String> {
        insert_into(submissions::table)
            .values(values)
            .on_conflict(submissions::id)
            .do_update()
            .set((
                submissions::user_id.eq(excluded(submissions::user_id)),
                submissions::result.eq(excluded(submissions::result)),
                submissions::point.eq(excluded(submissions::point)),
                submissions::execution_time.eq(excluded(submissions::execution_time)),
            ))
            .execute(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn insert_contests(&self, values: &[Contest]) -> Result<usize, String> {
        insert_into(contests::table)
            .values(values)
            .on_conflict(contests::id)
            .do_nothing()
            .execute(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn insert_problems(&self, values: &[Problem]) -> Result<usize, String> {
        insert_into(problems::table)
            .values(values)
            .on_conflict(problems::id)
            .do_nothing()
            .execute(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn insert_contest_problem_pair(
        &self,
        contest_problem_pairs: &[(&str, &str)],
    ) -> QueryResult<usize> {
        insert_into(contest_problem::table)
            .values(
                contest_problem_pairs
                    .iter()
                    .map(|&(contest, problem)| {
                        (
                            contest_problem::contest_id.eq(contest),
                            contest_problem::problem_id.eq(problem),
                        )
                    })
                    .collect::<Vec<_>>(),
            )
            .on_conflict((contest_problem::contest_id, contest_problem::problem_id))
            .do_nothing()
            .execute(self)
    }

    fn insert_performances(&self, performances: &[Performance]) -> QueryResult<usize> {
        insert_into(performances::table)
            .values(performances)
            .on_conflict((performances::contest_id, performances::user_id))
            .do_nothing()
            .execute(self)
    }

    fn get_problems(&self) -> Result<Vec<Problem>, String> {
        problems::dsl::problems
            .load::<Problem>(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_contests(&self) -> Result<Vec<Contest>, String> {
        contests::dsl::contests
            .load::<Contest>(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String> {
        submissions::dsl::submissions
            .filter(submissions::user_id.eq(user_id))
            .load::<Submission>(self)
            .map_err(|e| format!("{:?}", e))
    }

    fn get_contests_without_performances(&self) -> QueryResult<Vec<String>> {
        contests::table
            .left_join(performances::table.on(performances::contest_id.eq(contests::id)))
            .filter(performances::contest_id.is_null())
            .filter(contests::start_epoch_second.ge(FIRST_AGC_EPOCH_SECOND))
            .filter(contests::rate_change.ne(UNRATED_STATE))
            .select(contests::id)
            .load::<String>(self)
    }
}
