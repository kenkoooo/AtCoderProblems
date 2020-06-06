use crate::error::Result;
use crate::sql::schema::*;

use crate::error::ErrorTypes::InvalidRequest;
use diesel::prelude::*;
use diesel::{delete, insert_into, update, PgConnection};
use serde::Serialize;
use std::collections::BTreeMap;

const MAX_LIST_NUM: usize = 256;
const MAX_ITEM_NUM: usize = 1024;

#[derive(Serialize)]
pub(crate) struct ProblemList {
    internal_list_id: String,
    internal_list_name: String,
    internal_user_id: String,
    items: Vec<ListItem>,
}

#[derive(Serialize)]
pub(crate) struct ListItem {
    problem_id: String,
    memo: String,
}

pub(crate) trait ProblemListManager {
    fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>>;
    fn get_single_list(&self, internal_list_id: &str) -> Result<ProblemList>;

    fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String>;
    fn update_list(&self, internal_list_id: &str, name: &str) -> Result<()>;
    fn delete_list(&self, internal_list_id: &str) -> Result<()>;

    fn add_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()>;
    fn update_item(&self, internal_list_id: &str, problem_id: &str, memo: &str) -> Result<()>;
    fn delete_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()>;
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
                internal_problem_lists::internal_user_id,
                internal_problem_list_items::problem_id.nullable(),
                internal_problem_list_items::memo.nullable(),
            ))
            .load::<(String, String, String, Option<String>, Option<String>)>(self)?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, user_id, problem_id, memo) in items.into_iter() {
            let list = map
                .entry(list_id)
                .or_insert((list_name, user_id, Vec::new()));
            if let (Some(problem_id), Some(memo)) = (problem_id, memo) {
                list.2.push(ListItem { problem_id, memo });
            }
        }
        let list = map
            .into_iter()
            .map(
                |(internal_list_id, (internal_list_name, internal_user_id, items))| ProblemList {
                    internal_list_id,
                    internal_user_id,
                    internal_list_name,
                    items,
                },
            )
            .collect();
        Ok(list)
    }
    fn get_single_list(&self, internal_list_id: &str) -> Result<ProblemList> {
        let items = internal_problem_lists::table
            .left_join(
                internal_problem_list_items::table.on(internal_problem_lists::internal_list_id
                    .eq(internal_problem_list_items::internal_list_id)),
            )
            .filter(internal_problem_lists::internal_list_id.eq(internal_list_id))
            .select((
                internal_problem_lists::internal_list_id,
                internal_problem_lists::internal_list_name,
                internal_problem_lists::internal_user_id,
                internal_problem_list_items::problem_id.nullable(),
                internal_problem_list_items::memo.nullable(),
            ))
            .load::<(String, String, String, Option<String>, Option<String>)>(self)?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, user_id, problem_id, memo) in items.into_iter() {
            let list = map
                .entry(list_id)
                .or_insert((list_name, user_id, Vec::new()));
            if let (Some(problem_id), Some(memo)) = (problem_id, memo) {
                list.2.push(ListItem { problem_id, memo });
            }
        }
        let list = map
            .into_iter()
            .map(
                |(internal_list_id, (internal_list_name, internal_user_id, items))| ProblemList {
                    internal_list_id,
                    internal_user_id,
                    internal_list_name,
                    items,
                },
            )
            .next()
            .ok_or_else(|| InvalidRequest)?;
        Ok(list)
    }

    fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String> {
        let new_list_id = uuid::Uuid::new_v4().to_string();
        let list = self.get_list(internal_user_id)?;
        if list.len() >= MAX_LIST_NUM {
            return Err(http_types::Error::from(InvalidRequest));
        }
        insert_into(internal_problem_lists::table)
            .values(vec![(
                internal_problem_lists::internal_user_id.eq(internal_user_id),
                internal_problem_lists::internal_list_id.eq(new_list_id.as_str()),
                internal_problem_lists::internal_list_name.eq(name),
            )])
            .execute(self)?;
        Ok(new_list_id)
    }
    fn update_list(&self, internal_list_id: &str, name: &str) -> Result<()> {
        update(
            internal_problem_lists::table
                .filter(internal_problem_lists::internal_list_id.eq(internal_list_id)),
        )
        .set(internal_problem_lists::internal_list_name.eq(name))
        .execute(self)?;
        Ok(())
    }
    fn delete_list(&self, internal_list_id: &str) -> Result<()> {
        delete(
            internal_problem_lists::table
                .filter(internal_problem_lists::internal_list_id.eq(internal_list_id)),
        )
        .execute(self)?;
        Ok(())
    }

    fn add_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()> {
        let problems = internal_problem_list_items::table
            .filter(internal_problem_list_items::internal_list_id.eq(internal_list_id))
            .select(internal_problem_list_items::problem_id)
            .load::<String>(self)?;
        if problems.len() >= MAX_ITEM_NUM {
            return Err(http_types::Error::from(InvalidRequest));
        }
        insert_into(internal_problem_list_items::table)
            .values(vec![(
                internal_problem_list_items::internal_list_id.eq(internal_list_id),
                internal_problem_list_items::problem_id.eq(problem_id),
            )])
            .execute(self)?;
        Ok(())
    }

    fn update_item(&self, internal_list_id: &str, problem_id: &str, memo: &str) -> Result<()> {
        update(
            internal_problem_list_items::table.filter(
                internal_problem_list_items::internal_list_id
                    .eq(internal_list_id)
                    .and(internal_problem_list_items::problem_id.eq(problem_id)),
            ),
        )
        .set(internal_problem_list_items::memo.eq(memo))
        .execute(self)?;
        Ok(())
    }
    fn delete_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()> {
        delete(
            internal_problem_list_items::table.filter(
                internal_problem_list_items::internal_list_id
                    .eq(internal_list_id)
                    .and(internal_problem_list_items::problem_id.eq(problem_id)),
            ),
        )
        .execute(self)?;
        Ok(())
    }
}
