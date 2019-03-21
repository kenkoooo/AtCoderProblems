use crate::schema::{contests, problems, submissions};
use crate::{Contest, Problem, Submission};

use diesel::dsl::insert_into;
use diesel::pg::upsert::excluded;
use diesel::pg::PgConnection;
use diesel::prelude::*;

pub trait SqlClient {
    fn insert_submissions(&self, values: &[Submission]) -> Result<usize, String>;
    fn insert_contests(&self, values: &[Contest]) -> Result<usize, String>;
    fn insert_problems(&self, values: &[Problem]) -> Result<usize, String>;
    fn get_problems(&self) -> Result<Vec<Problem>, String>;
    fn get_contests(&self) -> Result<Vec<Contest>, String>;
    fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String>;
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
}
