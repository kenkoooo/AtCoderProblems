use crate::PgPool;
use anyhow::{ensure, Context, Result};
use async_trait::async_trait;
use serde::Serialize;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::collections::BTreeMap;

const MAX_LIST_NUM: usize = 256;
const MAX_ITEM_NUM: usize = 1024;

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct ProblemList {
    pub internal_list_id: String,
    pub internal_list_name: String,
    pub internal_user_id: String,
    pub items: Vec<ListItem>,
}

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct ListItem {
    pub problem_id: String,
    pub memo: String,
}

#[async_trait]
pub trait ProblemListManager {
    async fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>>;
    async fn get_single_list(&self, internal_list_id: &str) -> Result<ProblemList>;
    async fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String>;
    async fn update_list(&self, internal_list_id: &str, name: &str) -> Result<()>;
    async fn delete_list(&self, internal_list_id: &str) -> Result<()>;
    async fn add_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()>;
    async fn update_item(&self, internal_list_id: &str, problem_id: &str, memo: &str)
        -> Result<()>;
    async fn delete_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()>;
}

#[async_trait]
impl ProblemListManager for PgPool {
    async fn get_list(&self, internal_user_id: &str) -> Result<Vec<ProblemList>> {
        let items = sqlx::query(
            r"
        SELECT
            a.internal_list_id,
            a.internal_list_name,
            a.internal_user_id,
            b.problem_id,
            b.memo
        FROM internal_problem_lists AS a
        LEFT JOIN internal_problem_list_items AS b
        ON a.internal_list_id = b.internal_list_id
        WHERE a.internal_user_id = $1
            ",
        )
        .bind(internal_user_id)
        .try_map(|row: PgRow| {
            let internal_list_id: String = row.try_get("internal_list_id")?;
            let internal_list_name: String = row.try_get("internal_list_name")?;
            let internal_user_id: String = row.try_get("internal_user_id")?;
            let problem_id: Option<String> = row.try_get("problem_id")?;
            let memo: Option<String> = row.try_get("memo")?;
            Ok((
                internal_list_id,
                internal_list_name,
                internal_user_id,
                problem_id,
                memo,
            ))
        })
        .fetch_all(self)
        .await?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, user_id, problem_id, memo) in items {
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
                    internal_list_name,
                    internal_user_id,
                    items,
                },
            )
            .collect();
        Ok(list)
    }

    async fn get_single_list(&self, internal_list_id: &str) -> Result<ProblemList> {
        let items = sqlx::query(
            r"
        SELECT
            a.internal_list_id,
            a.internal_list_name,
            a.internal_user_id,
            b.problem_id,
            b.memo
        FROM internal_problem_lists AS a
        LEFT JOIN internal_problem_list_items AS b
        ON a.internal_list_id = b.internal_list_id
        WHERE a.internal_list_id = $1
            ",
        )
        .bind(internal_list_id)
        .map(|row: PgRow| {
            let internal_list_id: String = row.get(0);
            let internal_list_name: String = row.get(1);
            let internal_user_id: String = row.get(2);
            let problem_id: Option<String> = row.get(3);
            let memo: Option<String> = row.get(4);
            (
                internal_list_id,
                internal_list_name,
                internal_user_id,
                problem_id,
                memo,
            )
        })
        .fetch_all(self)
        .await?;
        let mut map = BTreeMap::new();
        for (list_id, list_name, user_id, problem_id, memo) in items {
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
                    internal_list_name,
                    internal_user_id,
                    items,
                },
            )
            .next()
            .context("list not found")?;
        Ok(list)
    }

    async fn create_list(&self, internal_user_id: &str, name: &str) -> Result<String> {
        let new_list_id = uuid::Uuid::new_v4().to_string();

        let list = self.get_list(internal_user_id).await?;

        ensure!(list.len() < MAX_LIST_NUM, "Cannot create a list anymore");

        sqlx::query(
            r"
            INSERT INTO internal_problem_lists
            (internal_user_id, internal_list_id, internal_list_name)
            VALUES ($1, $2, $3)
            ",
        )
        .bind(internal_user_id)
        .bind(&new_list_id)
        .bind(name)
        .execute(self)
        .await?;
        Ok(new_list_id)
    }

    async fn update_list(&self, internal_list_id: &str, name: &str) -> Result<()> {
        sqlx::query(
            r"
        UPDATE internal_problem_lists
        SET internal_list_name = $1
        WHERE internal_list_id = $2
            ",
        )
        .bind(name)
        .bind(internal_list_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn delete_list(&self, internal_list_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM internal_problem_lists WHERE internal_list_id = $1")
            .bind(internal_list_id)
            .execute(self)
            .await?;
        Ok(())
    }

    async fn add_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()> {
        let problems = sqlx::query(
            "SELECT problem_id FROM internal_problem_list_items WHERE internal_list_id = $1",
        )
        .bind(internal_list_id)
        .try_map(|row: PgRow| row.try_get::<String, _>("problem_id"))
        .fetch_all(self)
        .await?;

        ensure!(
            problems.len() < MAX_ITEM_NUM,
            "Cannot create a list item anymore"
        );

        sqlx::query(
            r"
            INSERT INTO internal_problem_list_items (internal_list_id, problem_id)
            VALUES ($1, $2)
            ",
        )
        .bind(internal_list_id)
        .bind(problem_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn update_item(
        &self,
        internal_list_id: &str,
        problem_id: &str,
        memo: &str,
    ) -> Result<()> {
        sqlx::query(
            r"
        UPDATE internal_problem_list_items
        SET memo = $1
        WHERE internal_list_id = $2 AND problem_id = $3
            ",
        )
        .bind(memo)
        .bind(internal_list_id)
        .bind(problem_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn delete_item(&self, internal_list_id: &str, problem_id: &str) -> Result<()> {
        sqlx::query(
            r"
            DELETE FROM internal_problem_list_items
            WHERE internal_list_id = $1 AND problem_id = $2
            ",
        )
        .bind(internal_list_id)
        .bind(problem_id)
        .execute(self)
        .await?;
        Ok(())
    }
}
