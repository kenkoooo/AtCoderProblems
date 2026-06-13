use sea_orm::{ActiveValue, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter};
use serde::Serialize;
use sql_entities::{internal_problem_list_items, internal_problem_lists};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ListItem {
    pub problem_id: String,
    pub memo: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ProblemList {
    pub internal_list_id: String,
    pub internal_list_name: String,
    pub internal_user_id: String,
    pub items: Vec<ListItem>,
}

fn build_list(
    list: internal_problem_lists::Model,
    items: Vec<internal_problem_list_items::Model>,
) -> ProblemList {
    ProblemList {
        internal_list_id: list.internal_list_id,
        internal_list_name: list.internal_list_name.unwrap_or_default(),
        internal_user_id: list.internal_user_id.unwrap_or_default(),
        items: items
            .into_iter()
            .map(|i| ListItem {
                problem_id: i.problem_id,
                memo: i.memo.unwrap_or_default(),
            })
            .collect(),
    }
}

/// Return the owner (`internal_user_id`) of the list, or `None` if it does not exist.
pub async fn get_owner(
    db: &DatabaseConnection,
    internal_list_id: &str,
) -> Result<Option<String>, DbErr> {
    Ok(
        internal_problem_lists::Entity::find_by_id(internal_list_id.to_string())
            .one(db)
            .await?
            .and_then(|m| m.internal_user_id),
    )
}

pub async fn get_single_list(
    db: &DatabaseConnection,
    internal_list_id: &str,
) -> Result<Option<ProblemList>, DbErr> {
    let Some(list) = internal_problem_lists::Entity::find_by_id(internal_list_id.to_string())
        .one(db)
        .await?
    else {
        return Ok(None);
    };
    let items = internal_problem_list_items::Entity::find()
        .filter(internal_problem_list_items::Column::InternalListId.eq(internal_list_id))
        .all(db)
        .await?;
    Ok(Some(build_list(list, items)))
}

pub async fn get_user_lists(
    db: &DatabaseConnection,
    internal_user_id: &str,
) -> Result<Vec<ProblemList>, DbErr> {
    let lists = internal_problem_lists::Entity::find()
        .filter(internal_problem_lists::Column::InternalUserId.eq(internal_user_id))
        .all(db)
        .await?;
    if lists.is_empty() {
        return Ok(Vec::new());
    }
    let list_ids: Vec<String> = lists.iter().map(|l| l.internal_list_id.clone()).collect();
    // Fetch all items across every list in one query, then group in memory.
    let items = internal_problem_list_items::Entity::find()
        .filter(internal_problem_list_items::Column::InternalListId.is_in(list_ids))
        .all(db)
        .await?;
    let mut items_by_list: std::collections::HashMap<
        String,
        Vec<internal_problem_list_items::Model>,
    > = std::collections::HashMap::new();
    for item in items {
        items_by_list
            .entry(item.internal_list_id.clone())
            .or_default()
            .push(item);
    }
    let mut out = Vec::with_capacity(lists.len());
    for list in lists {
        let items = items_by_list
            .remove(&list.internal_list_id)
            .unwrap_or_default();
        out.push(build_list(list, items));
    }
    Ok(out)
}

pub async fn create_list(
    db: &DatabaseConnection,
    internal_user_id: &str,
    name: &str,
) -> Result<String, DbErr> {
    let internal_list_id = uuid::Uuid::new_v4().to_string();
    let am = internal_problem_lists::ActiveModel {
        internal_list_id: ActiveValue::Set(internal_list_id.clone()),
        internal_user_id: ActiveValue::Set(Some(internal_user_id.to_string())),
        internal_list_name: ActiveValue::Set(Some(name.to_string())),
    };
    internal_problem_lists::Entity::insert(am).exec(db).await?;
    Ok(internal_list_id)
}

/// Returns `false` if no row matched (e.g. the list was deleted between the
/// owner check and this call).
pub async fn update_list(
    db: &DatabaseConnection,
    internal_list_id: &str,
    name: &str,
) -> Result<bool, DbErr> {
    let result = internal_problem_lists::Entity::update_many()
        .col_expr(
            internal_problem_lists::Column::InternalListName,
            sea_orm::sea_query::Expr::value(name.to_string()),
        )
        .filter(internal_problem_lists::Column::InternalListId.eq(internal_list_id))
        .exec(db)
        .await?;
    Ok(result.rows_affected > 0)
}

/// Returns `false` if the list did not exist at delete time.
pub async fn delete_list(db: &DatabaseConnection, internal_list_id: &str) -> Result<bool, DbErr> {
    let result = internal_problem_lists::Entity::delete_by_id(internal_list_id.to_string())
        .exec(db)
        .await?;
    Ok(result.rows_affected > 0)
}

pub async fn add_item(
    db: &DatabaseConnection,
    internal_list_id: &str,
    problem_id: &str,
) -> Result<(), DbErr> {
    let am = internal_problem_list_items::ActiveModel {
        internal_list_id: ActiveValue::Set(internal_list_id.to_string()),
        problem_id: ActiveValue::Set(problem_id.to_string()),
        memo: ActiveValue::Set(Some(String::new())),
    };
    internal_problem_list_items::Entity::insert(am)
        .exec(db)
        .await?;
    Ok(())
}

/// Returns `false` if the item row was not present.
pub async fn update_item(
    db: &DatabaseConnection,
    internal_list_id: &str,
    problem_id: &str,
    memo: &str,
) -> Result<bool, DbErr> {
    let result = internal_problem_list_items::Entity::update_many()
        .col_expr(
            internal_problem_list_items::Column::Memo,
            sea_orm::sea_query::Expr::value(memo.to_string()),
        )
        .filter(internal_problem_list_items::Column::InternalListId.eq(internal_list_id))
        .filter(internal_problem_list_items::Column::ProblemId.eq(problem_id))
        .exec(db)
        .await?;
    Ok(result.rows_affected > 0)
}

/// Returns `false` if the item row was not present.
pub async fn delete_item(
    db: &DatabaseConnection,
    internal_list_id: &str,
    problem_id: &str,
) -> Result<bool, DbErr> {
    let result = internal_problem_list_items::Entity::delete_many()
        .filter(internal_problem_list_items::Column::InternalListId.eq(internal_list_id))
        .filter(internal_problem_list_items::Column::ProblemId.eq(problem_id))
        .exec(db)
        .await?;
    Ok(result.rows_affected > 0)
}
