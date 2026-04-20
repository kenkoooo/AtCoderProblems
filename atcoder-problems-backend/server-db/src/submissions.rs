use sea_orm::{
    ColumnTrait, DatabaseConnection, DbErr, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
    sea_query::{Expr, Func},
};
use serde::Serialize;
use sql_entities::submissions;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Submission {
    pub id: i64,
    pub epoch_second: i64,
    pub problem_id: String,
    pub contest_id: String,
    pub user_id: String,
    pub language: String,
    pub point: f64,
    pub length: i32,
    pub result: String,
    pub execution_time: Option<i32>,
}

impl From<submissions::Model> for Submission {
    fn from(m: submissions::Model) -> Self {
        Self {
            id: m.id,
            epoch_second: m.epoch_second,
            problem_id: m.problem_id,
            contest_id: m.contest_id,
            user_id: m.user_id,
            language: m.language,
            point: m.point,
            length: m.length,
            result: m.result,
            execution_time: m.execution_time,
        }
    }
}

fn to_dtos(rows: Vec<submissions::Model>) -> Vec<Submission> {
    rows.into_iter().map(Into::into).collect()
}

pub async fn get_from_time(
    db: &DatabaseConnection,
    from_second: i64,
    count: u64,
) -> Result<Vec<Submission>, DbErr> {
    let rows = submissions::Entity::find()
        .filter(submissions::Column::EpochSecond.gte(from_second))
        .order_by_asc(submissions::Column::EpochSecond)
        .limit(count)
        .all(db)
        .await?;
    Ok(to_dtos(rows))
}

pub async fn get_from_user_and_time(
    db: &DatabaseConnection,
    user_id: &str,
    from_second: i64,
    count: u64,
) -> Result<Vec<Submission>, DbErr> {
    let rows = submissions::Entity::find()
        .filter(
            Expr::expr(Func::lower(Expr::col(submissions::Column::UserId)))
                .eq(user_id.to_lowercase()),
        )
        .filter(submissions::Column::EpochSecond.gte(from_second))
        .order_by_asc(submissions::Column::EpochSecond)
        .limit(count)
        .all(db)
        .await?;
    Ok(to_dtos(rows))
}

pub async fn get_recent_all(db: &DatabaseConnection, count: u64) -> Result<Vec<Submission>, DbErr> {
    let rows = submissions::Entity::find()
        .order_by_desc(submissions::Column::Id)
        .limit(count)
        .all(db)
        .await?;
    Ok(to_dtos(rows))
}

pub async fn get_users_problems_time(
    db: &DatabaseConnection,
    user_ids: &[&str],
    problem_ids: &[&str],
    from_second: i64,
    to_second: i64,
    limit: u64,
) -> Result<Vec<Submission>, DbErr> {
    let users_lower: Vec<String> = user_ids.iter().map(|u| u.to_lowercase()).collect();
    let problems: Vec<String> = problem_ids.iter().map(|p| p.to_string()).collect();
    let rows = submissions::Entity::find()
        .filter(Expr::expr(Func::lower(Expr::col(submissions::Column::UserId))).is_in(users_lower))
        .filter(submissions::Column::ProblemId.is_in(problems))
        .filter(submissions::Column::EpochSecond.gte(from_second))
        .filter(submissions::Column::EpochSecond.lte(to_second))
        // Deterministic ordering so paginated callers don't miss or duplicate
        // rows when the result set exceeds `limit`.
        .order_by_asc(submissions::Column::EpochSecond)
        .order_by_asc(submissions::Column::Id)
        .limit(limit)
        .all(db)
        .await?;
    Ok(to_dtos(rows))
}

pub async fn count_user_submissions(
    db: &DatabaseConnection,
    user_id: &str,
    from_second: i64,
    to_second: i64,
) -> Result<u64, DbErr> {
    submissions::Entity::find()
        .filter(
            Expr::expr(Func::lower(Expr::col(submissions::Column::UserId)))
                .eq(user_id.to_lowercase()),
        )
        .filter(submissions::Column::EpochSecond.gte(from_second))
        .filter(submissions::Column::EpochSecond.lt(to_second))
        .count(db)
        .await
}
