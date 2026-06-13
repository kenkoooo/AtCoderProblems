use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect,
    sea_query::{Expr, OnConflict},
};
use serde::{Deserialize, Serialize};
use sql_entities::{
    internal_users, internal_virtual_contest_items, internal_virtual_contest_participants,
    internal_virtual_contests,
};

const RECENT_CONTEST_NUM: u64 = 1000;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct VirtualContestInfo {
    pub id: String,
    pub title: String,
    pub memo: String,
    pub owner_user_id: String,
    pub start_epoch_second: i64,
    pub duration_second: i64,
    pub mode: Option<String>,
    pub is_public: bool,
    pub penalty_second: i64,
}

impl From<internal_virtual_contests::Model> for VirtualContestInfo {
    fn from(m: internal_virtual_contests::Model) -> Self {
        Self {
            id: m.id,
            title: m.title.unwrap_or_default(),
            memo: m.memo.unwrap_or_default(),
            owner_user_id: m.internal_user_id.unwrap_or_default(),
            start_epoch_second: m.start_epoch_second,
            duration_second: m.duration_second,
            mode: m.mode,
            is_public: m.is_public,
            penalty_second: m.penalty_second,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VirtualContestItem {
    pub id: String,
    pub point: Option<i64>,
    pub order: Option<i64>,
}

#[allow(clippy::too_many_arguments)]
pub async fn create_contest(
    db: &DatabaseConnection,
    title: &str,
    memo: &str,
    internal_user_id: &str,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<&str>,
    is_public: bool,
    penalty_second: i64,
) -> Result<String, DbErr> {
    let contest_id = uuid::Uuid::new_v4().to_string();
    let am = internal_virtual_contests::ActiveModel {
        id: ActiveValue::Set(contest_id.clone()),
        title: ActiveValue::Set(Some(title.to_string())),
        memo: ActiveValue::Set(Some(memo.to_string())),
        internal_user_id: ActiveValue::Set(Some(internal_user_id.to_string())),
        start_epoch_second: ActiveValue::Set(start_epoch_second),
        duration_second: ActiveValue::Set(duration_second),
        mode: ActiveValue::Set(mode.map(|s| s.to_string())),
        is_public: ActiveValue::Set(is_public),
        penalty_second: ActiveValue::Set(penalty_second),
    };
    internal_virtual_contests::Entity::insert(am)
        .exec(db)
        .await?;
    Ok(contest_id)
}

/// Update the contest. Returns `false` if no row matched `id` (e.g. the row was
/// deleted between the owner check and this call).
#[allow(clippy::too_many_arguments)]
pub async fn update_contest(
    db: &DatabaseConnection,
    id: &str,
    title: &str,
    memo: &str,
    start_epoch_second: i64,
    duration_second: i64,
    mode: Option<&str>,
    is_public: bool,
    penalty_second: i64,
) -> Result<bool, DbErr> {
    let result = internal_virtual_contests::Entity::update_many()
        .col_expr(
            internal_virtual_contests::Column::Title,
            Expr::value(title.to_string()),
        )
        .col_expr(
            internal_virtual_contests::Column::Memo,
            Expr::value(memo.to_string()),
        )
        .col_expr(
            internal_virtual_contests::Column::StartEpochSecond,
            Expr::value(start_epoch_second),
        )
        .col_expr(
            internal_virtual_contests::Column::DurationSecond,
            Expr::value(duration_second),
        )
        .col_expr(
            internal_virtual_contests::Column::Mode,
            Expr::value(mode.map(|s| s.to_string())),
        )
        .col_expr(
            internal_virtual_contests::Column::IsPublic,
            Expr::value(is_public),
        )
        .col_expr(
            internal_virtual_contests::Column::PenaltySecond,
            Expr::value(penalty_second),
        )
        .filter(internal_virtual_contests::Column::Id.eq(id))
        .exec(db)
        .await?;
    Ok(result.rows_affected > 0)
}

/// Return the owner (`internal_user_id`) of the contest, or `None` if it does not exist.
pub async fn get_owner(db: &DatabaseConnection, contest_id: &str) -> Result<Option<String>, DbErr> {
    Ok(
        internal_virtual_contests::Entity::find_by_id(contest_id.to_string())
            .one(db)
            .await?
            .and_then(|m| m.internal_user_id),
    )
}

pub async fn get_single_info(
    db: &DatabaseConnection,
    contest_id: &str,
) -> Result<Option<VirtualContestInfo>, DbErr> {
    Ok(
        internal_virtual_contests::Entity::find_by_id(contest_id.to_string())
            .one(db)
            .await?
            .map(Into::into),
    )
}

pub async fn get_single_problems(
    db: &DatabaseConnection,
    contest_id: &str,
) -> Result<Vec<VirtualContestItem>, DbErr> {
    let rows = internal_virtual_contest_items::Entity::find()
        .filter(internal_virtual_contest_items::Column::InternalVirtualContestId.eq(contest_id))
        .order_by_asc(internal_virtual_contest_items::Column::UserDefinedOrder)
        .order_by_asc(internal_virtual_contest_items::Column::ProblemId)
        .all(db)
        .await?;
    Ok(rows
        .into_iter()
        .map(|r| VirtualContestItem {
            id: r.problem_id,
            point: r.user_defined_point,
            order: r.user_defined_order,
        })
        .collect())
}

/// Return participants' `atcoder_user_id` values (users with no `atcoder_user_id` are excluded).
pub async fn get_single_participants(
    db: &DatabaseConnection,
    contest_id: &str,
) -> Result<Vec<String>, DbErr> {
    let participants = internal_virtual_contest_participants::Entity::find()
        .filter(
            internal_virtual_contest_participants::Column::InternalVirtualContestId.eq(contest_id),
        )
        .all(db)
        .await?;
    let ids: Vec<String> = participants
        .into_iter()
        .map(|p| p.internal_user_id)
        .collect();
    if ids.is_empty() {
        return Ok(Vec::new());
    }
    let users = internal_users::Entity::find()
        .filter(internal_users::Column::InternalUserId.is_in(ids))
        .filter(internal_users::Column::AtcoderUserId.is_not_null())
        .all(db)
        .await?;
    let mut out: Vec<String> = users
        .into_iter()
        .filter_map(|u| u.atcoder_user_id)
        .collect();
    out.sort();
    Ok(out)
}

pub async fn get_own_contests(
    db: &DatabaseConnection,
    internal_user_id: &str,
) -> Result<Vec<VirtualContestInfo>, DbErr> {
    let rows = internal_virtual_contests::Entity::find()
        .filter(internal_virtual_contests::Column::InternalUserId.eq(internal_user_id))
        .all(db)
        .await?;
    Ok(rows.into_iter().map(Into::into).collect())
}

pub async fn get_participated_contests(
    db: &DatabaseConnection,
    internal_user_id: &str,
) -> Result<Vec<VirtualContestInfo>, DbErr> {
    let contest_ids: Vec<String> = internal_virtual_contest_participants::Entity::find()
        .filter(internal_virtual_contest_participants::Column::InternalUserId.eq(internal_user_id))
        .all(db)
        .await?
        .into_iter()
        .map(|p| p.internal_virtual_contest_id)
        .collect();
    if contest_ids.is_empty() {
        return Ok(Vec::new());
    }
    let rows = internal_virtual_contests::Entity::find()
        .filter(internal_virtual_contests::Column::Id.is_in(contest_ids))
        .all(db)
        .await?;
    Ok(rows.into_iter().map(Into::into).collect())
}

/// Most recent public contests.
/// Original SQL: ORDER BY start_epoch_second + duration_second DESC LIMIT 1000
pub async fn get_recent_contests(
    db: &DatabaseConnection,
) -> Result<Vec<VirtualContestInfo>, DbErr> {
    let rows = internal_virtual_contests::Entity::find()
        .filter(internal_virtual_contests::Column::IsPublic.eq(true))
        .order_by_desc(
            Expr::col(internal_virtual_contests::Column::StartEpochSecond)
                .add(Expr::col(internal_virtual_contests::Column::DurationSecond)),
        )
        .limit(RECENT_CONTEST_NUM)
        .all(db)
        .await?;
    Ok(rows.into_iter().map(Into::into).collect())
}

pub async fn join_contest(
    db: &DatabaseConnection,
    contest_id: &str,
    internal_user_id: &str,
) -> Result<(), DbErr> {
    let am = internal_virtual_contest_participants::ActiveModel {
        internal_virtual_contest_id: ActiveValue::Set(contest_id.to_string()),
        internal_user_id: ActiveValue::Set(internal_user_id.to_string()),
    };
    // No-op if the user is already a participant; makes the endpoint idempotent against double POSTs.
    let result = internal_virtual_contest_participants::Entity::insert(am)
        .on_conflict(
            OnConflict::columns([
                internal_virtual_contest_participants::Column::InternalVirtualContestId,
                internal_virtual_contest_participants::Column::InternalUserId,
            ])
            .do_nothing()
            .to_owned(),
        )
        .do_nothing()
        .exec(db)
        .await;
    match result {
        Ok(_) | Err(DbErr::RecordNotInserted) => Ok(()),
        Err(e) => Err(e),
    }
}

pub async fn leave_contest(
    db: &DatabaseConnection,
    contest_id: &str,
    internal_user_id: &str,
) -> Result<(), DbErr> {
    internal_virtual_contest_participants::Entity::delete_many()
        .filter(
            internal_virtual_contest_participants::Column::InternalVirtualContestId.eq(contest_id),
        )
        .filter(internal_virtual_contest_participants::Column::InternalUserId.eq(internal_user_id))
        .exec(db)
        .await?;
    Ok(())
}

/// Delete existing items, then bulk-insert the new ones.
/// Authorization is the caller's (handler's) responsibility. The delete and insert run in a
/// single transaction so a mid-flight failure cannot leave the contest with no items.
pub async fn update_items(
    db: &DatabaseConnection,
    contest_id: &str,
    items: &[VirtualContestItem],
) -> Result<(), DbErr> {
    use sea_orm::TransactionTrait;
    let contest_id = contest_id.to_string();
    let items = items.to_vec();
    db.transaction::<_, (), DbErr>(|tx| {
        Box::pin(async move {
            internal_virtual_contest_items::Entity::delete_many()
                .filter(
                    internal_virtual_contest_items::Column::InternalVirtualContestId
                        .eq(contest_id.clone()),
                )
                .exec(tx)
                .await?;
            if items.is_empty() {
                return Ok(());
            }
            let active: Vec<internal_virtual_contest_items::ActiveModel> = items
                .iter()
                .map(|i| internal_virtual_contest_items::ActiveModel {
                    internal_virtual_contest_id: ActiveValue::Set(contest_id.clone()),
                    problem_id: ActiveValue::Set(i.id.clone()),
                    user_defined_point: ActiveValue::Set(i.point),
                    user_defined_order: ActiveValue::Set(i.order),
                })
                .collect();
            internal_virtual_contest_items::Entity::insert_many(active)
                .exec(tx)
                .await?;
            Ok(())
        })
    })
    .await
    .map_err(|e| match e {
        sea_orm::TransactionError::Connection(e) => e,
        sea_orm::TransactionError::Transaction(e) => e,
    })
}
