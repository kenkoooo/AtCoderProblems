use crate::error::Result;
use crate::sql::models::ContestProblem;
use crate::sql::schema::contest_problem;

use diesel::dsl::*;
use diesel::prelude::*;
use diesel::PgConnection;

pub trait ContestProblemClient {
    fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<usize>;
    fn load_contest_problem(&self) -> Result<Vec<ContestProblem>>;
}

impl ContestProblemClient for PgConnection {
    fn insert_contest_problem(&self, contest_problems: &[ContestProblem]) -> Result<usize> {
        let result = insert_into(contest_problem::table)
            .values(contest_problems)
            .on_conflict((contest_problem::contest_id, contest_problem::problem_id))
            .do_nothing()
            .execute(self)?;
        Ok(result)
    }

    fn load_contest_problem(&self) -> Result<Vec<ContestProblem>> {
        let problems = contest_problem::table.load::<ContestProblem>(self)?;
        Ok(problems)
    }
}
