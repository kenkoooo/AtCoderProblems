use super::models::*;
use super::schema::*;

use diesel::dsl::insert_into;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::QueryResult;

pub trait SimpleClient {
    fn insert_contests(&self, values: &[Contest]) -> QueryResult<usize>;
    fn insert_problems(&self, values: &[Problem]) -> QueryResult<usize>;
    fn insert_performances(&self, performances: &[Performance]) -> QueryResult<usize>;

    fn load_problems(&self) -> QueryResult<Vec<Problem>>;
    fn load_contests(&self) -> QueryResult<Vec<Contest>>;
    fn load_performances(&self) -> QueryResult<Vec<Performance>>;
}

impl SimpleClient for PgConnection {
    fn insert_contests(&self, values: &[Contest]) -> QueryResult<usize> {
        insert_into(contests::table)
            .values(values)
            .on_conflict(contests::id)
            .do_nothing()
            .execute(self)
    }

    fn insert_problems(&self, values: &[Problem]) -> QueryResult<usize> {
        insert_into(problems::table)
            .values(values)
            .on_conflict(problems::id)
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

    fn load_problems(&self) -> QueryResult<Vec<Problem>> {
        problems::table.load::<Problem>(self)
    }

    fn load_contests(&self) -> QueryResult<Vec<Contest>> {
        contests::table.load::<Contest>(self)
    }

    fn load_performances(&self) -> QueryResult<Vec<Performance>> {
        performances::table.load::<Performance>(self)
    }
}
