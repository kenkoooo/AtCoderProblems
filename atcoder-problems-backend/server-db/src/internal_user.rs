use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter,
    sea_query::OnConflict,
};
use serde::Serialize;
use sql_entities::internal_users;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct InternalUserInfo {
    pub internal_user_id: String,
    pub atcoder_user_id: Option<String>,
}

impl From<internal_users::Model> for InternalUserInfo {
    fn from(m: internal_users::Model) -> Self {
        Self {
            internal_user_id: m.internal_user_id,
            atcoder_user_id: m.atcoder_user_id,
        }
    }
}

pub async fn register_user(db: &DatabaseConnection, internal_user_id: &str) -> Result<(), DbErr> {
    let am = internal_users::ActiveModel {
        internal_user_id: ActiveValue::Set(internal_user_id.to_string()),
        atcoder_user_id: ActiveValue::NotSet,
    };
    let res = internal_users::Entity::insert(am)
        .on_conflict(
            OnConflict::column(internal_users::Column::InternalUserId)
                .do_nothing()
                .to_owned(),
        )
        .do_nothing()
        .exec(db)
        .await;
    match res {
        Ok(_) => Ok(()),
        Err(DbErr::RecordNotInserted) => Ok(()),
        Err(e) => Err(e),
    }
}

pub async fn get_user(
    db: &DatabaseConnection,
    internal_user_id: &str,
) -> Result<Option<InternalUserInfo>, DbErr> {
    let model = internal_users::Entity::find()
        .filter(internal_users::Column::InternalUserId.eq(internal_user_id))
        .one(db)
        .await?;
    Ok(model.map(Into::into))
}

pub async fn update_atcoder_user_id(
    db: &DatabaseConnection,
    internal_user_id: &str,
    atcoder_user_id: &str,
) -> Result<(), DbErr> {
    internal_users::Entity::update_many()
        .col_expr(
            internal_users::Column::AtcoderUserId,
            sea_orm::sea_query::Expr::value(atcoder_user_id.to_string()),
        )
        .filter(internal_users::Column::InternalUserId.eq(internal_user_id))
        .exec(db)
        .await?;
    Ok(())
}
