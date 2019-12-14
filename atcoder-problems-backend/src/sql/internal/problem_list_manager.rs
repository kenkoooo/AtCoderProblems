use crate::error::Result;
use crate::sql::schema::*;

use diesel::prelude::*;
use diesel::{insert_into, PgConnection};
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize)]
pub(crate) struct ProblemList {
    internal_list_id: String,
    internal_list_name: String,
    items: Vec<ListItem>,
}

#[derive(Serialize)]
pub(crate) struct ListItem {
    problem_id: String,
    memo: String,
}

pub(crate) trait ProblemListManager {
    fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>>;
    fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String>;
}

impl ProblemListManager for PgConnection {
    fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>> {
        let items = internal_problem_lists::table
            .left_join(
                internal_problem_list_items::table.on(internal_problem_lists::internal_list_id
                    .eq(internal_problem_list_items::internal_list_id)),
            )
            .filter(internal_problem_lists::internal_user_id.eq(internal_user_id))
            .select((
                internal_problem_lists::internal_list_id,
                internal_problem_lists::internal_list_name,
                internal_problem_list_items::problem_id.nullable(),
                internal_problem_list_items::memo.nullable(),
            ))
            .load::<(String, String, Option<String>, Option<String>)>(self)?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, problem_id, memo) in items.into_iter() {
            let list = map.entry(list_id).or_insert((list_name, Vec::new()));
            if let (Some(problem_id), Some(memo)) = (problem_id, memo) {
                list.1.push(ListItem { problem_id, memo });
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
    fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String> {
        let new_list_id = uuid::Uuid::new_v4().to_string();
        insert_into(internal_problem_lists::table)
            .values(vec![(
                internal_problem_lists::internal_user_id.eq(internal_user_id),
                internal_problem_lists::internal_list_id.eq(new_list_id.as_str()),
                internal_problem_lists::internal_list_name.eq(name),
            )])
            .execute(self)?;
        Ok(new_list_id)
    }
}
