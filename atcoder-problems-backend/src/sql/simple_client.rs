use super::models::*;
use super::schema::*;
use anyhow::Result;

use diesel::dsl::insert_into;
use diesel::pg::PgConnection;
use diesel::prelude::*;

pub trait SimpleClient {
    fn insert_contests(&self, values: &[Contest]) -> Result<usize>;
    fn insert_problems(&self, values: &[Problem]) -> Result<usize>;

    fn load_problems(&self) -> Result<Vec<Problem>>;
    fn load_contests(&self) -> Result<Vec<Contest>>;
}

impl SimpleClient for PgConnection {
    fn insert_contests(&self, values: &[Contest]) -> Result<usize> {
        let result = insert_into(contests::table)
            .values(values)
            .on_conflict(contests::id)
            .do_nothing()
            .execute(self)?;
        Ok(result)
    }

    fn insert_problems(&self, values: &[Problem]) -> Result<usize> {
        let result = insert_into(problems::table)
            .values(values)
            .on_conflict(problems::id)
            .do_nothing()
            .execute(self)?;
        Ok(result)
    }

    fn load_problems(&self) -> Result<Vec<Problem>> {
        let problems = problems::table.load::<Problem>(self)?;
        Ok(problems)
    }

    fn load_contests(&self) -> Result<Vec<Contest>> {
        let contests = contests::table.load::<Contest>(self)?;
        Ok(contests)
    }
}
