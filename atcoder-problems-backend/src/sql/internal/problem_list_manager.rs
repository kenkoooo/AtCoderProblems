use crate::error::Result;
use crate::sql::schema::*;

use diesel::dsl::*;
use diesel::prelude::*;
use diesel::query_dsl::*;
use diesel::sql_types::*;
use diesel::PgConnection;
use diesel::Queryable;
use std::collections::BTreeMap;

struct ProblemList {
    internal_list_id: String,
    internal_list_name: String,
    items: Vec<ListItem>,
}

struct ListItem {
    problem_id: String,
    memo: String,
}

trait ProblemListManager {
    fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>>;
}

impl ProblemListManager for PgConnection {
    fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>> {
        let items = internal_problem_list_items::table
            .left_join(
                internal_problem_lists::table.on(internal_problem_list_items::internal_list_id
                    .eq(internal_problem_lists::internal_list_id)),
            )
            .filter(internal_problem_lists::internal_user_id.eq(internal_user_id))
            .select((
                internal_problem_lists::internal_list_id.nullable(),
                internal_problem_lists::internal_list_name.nullable(),
                internal_problem_list_items::problem_id,
                internal_problem_list_items::memo,
            ))
            .load::<(Option<String>, Option<String>, String, String)>(self)?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, problem_id, memo) in items.into_iter() {
            if let (Some(list_id), Some(list_name)) = (list_id, list_name) {
                map.entry(list_id)
                    .or_insert((list_name, Vec::new()))
                    .1
                    .push(ListItem { problem_id, memo });
            }
        }
        let list = map
            .into_iter()
            .map(
                |(internal_list_id, (internal_list_name, items))| ProblemList {
                    internal_list_id,
                    internal_list_name,
                    items,
                },
            )
            .collect();
        Ok(list)
    }
}
