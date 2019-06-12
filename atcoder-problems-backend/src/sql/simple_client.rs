use super::models::*;
use super::schema::*;
use super::{FIRST_AGC_EPOCH_SECOND, UNRATED_STATE};

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

    fn load_contest_ids_without_performances(&self) -> QueryResult<Vec<String>>;
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

    fn load_contest_ids_without_performances(&self) -> QueryResult<Vec<String>> {
        contests::table
            .left_join(performances::table.on(performances::contest_id.eq(contests::id)))
            .filter(performances::contest_id.is_null())
            .filter(contests::start_epoch_second.ge(FIRST_AGC_EPOCH_SECOND))
            .filter(contests::rate_change.ne(UNRATED_STATE))
            .select(contests::id)
            .load::<String>(self)
    }
}
