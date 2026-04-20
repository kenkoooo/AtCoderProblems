use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter,
    sea_query::OnConflict,
};
use serde::Serialize;
use sql_entities::internal_progress_reset;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ProgressResetItem {
    pub problem_id: String,
    pub reset_epoch_second: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ProgressResetList {
    pub items: Vec<ProgressResetItem>,
}

pub async fn get_list(
    db: &DatabaseConnection,
    internal_user_id: &str,
) -> Result<ProgressResetList, DbErr> {
    let rows = internal_progress_reset::Entity::find()
        .filter(internal_progress_reset::Column::InternalUserId.eq(internal_user_id))
        .all(db)
        .await?;
    let items = rows
        .into_iter()
        .map(|r| ProgressResetItem {
            problem_id: r.problem_id,
            reset_epoch_second: r.reset_epoch_second,
        })
        .collect();
    Ok(ProgressResetList { items })
}

pub async fn add_item(
    db: &DatabaseConnection,
    internal_user_id: &str,
    problem_id: &str,
    reset_epoch_second: i64,
) -> Result<(), DbErr> {
    let am = internal_progress_reset::ActiveModel {
        internal_user_id: ActiveValue::Set(internal_user_id.to_string()),
        problem_id: ActiveValue::Set(problem_id.to_string()),
        reset_epoch_second: ActiveValue::Set(reset_epoch_second),
    };
    internal_progress_reset::Entity::insert(am)
        .on_conflict(
            OnConflict::columns([
                internal_progress_reset::Column::InternalUserId,
                internal_progress_reset::Column::ProblemId,
            ])
            .update_column(internal_progress_reset::Column::ResetEpochSecond)
            .to_owned(),
        )
        .exec(db)
        .await?;
    Ok(())
}

pub async fn remove_item(
    db: &DatabaseConnection,
    internal_user_id: &str,
    problem_id: &str,
) -> Result<(), DbErr> {
    internal_progress_reset::Entity::delete_many()
        .filter(internal_progress_reset::Column::InternalUserId.eq(internal_user_id))
        .filter(internal_progress_reset::Column::ProblemId.eq(problem_id))
        .exec(db)
        .await?;
    Ok(())
}
