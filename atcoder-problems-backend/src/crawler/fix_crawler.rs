use crate::sql::schema::submissions;

use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::PgConnection;

pub(crate) struct FixCrawler;

#[cfg(test)]
mod tests {
    #[test]
    fn test_find() {}
}
