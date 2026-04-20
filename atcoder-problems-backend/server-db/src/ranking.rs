use sea_orm::{
    ColumnTrait, ConnectionTrait, DatabaseConnection, DbErr, EntityTrait, FromQueryResult,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    sea_query::{Alias, Expr, Func, IntoCondition, JoinType, Order, Query},
};
use sql_entities::{accepted_count, language_count, max_streaks, rated_point_sum};

#[derive(Debug, Clone, FromQueryResult)]
pub struct UserProblemCount {
    pub user_id: String,
    pub problem_count: i32,
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct UserSum {
    pub user_id: String,
    pub point_sum: i64,
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct UserStreak {
    pub user_id: String,
    pub streak: i64,
}

pub async fn load_accepted_count_in_range(
    db: &DatabaseConnection,
    offset: u64,
    limit: u64,
) -> Result<Vec<UserProblemCount>, DbErr> {
    accepted_count::Entity::find()
        .order_by_desc(accepted_count::Column::ProblemCount)
        .order_by_asc(accepted_count::Column::UserId)
        .offset(offset)
        .limit(limit)
        .into_model::<UserProblemCount>()
        .all(db)
        .await
}

pub async fn get_users_accepted_count(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<Option<i64>, DbErr> {
    let model = accepted_count::Entity::find()
        .filter(
            Expr::expr(Func::lower(Expr::col(accepted_count::Column::UserId)))
                .eq(user_id.to_lowercase()),
        )
        .one(db)
        .await?;
    Ok(model.map(|m| m.problem_count as i64))
}

pub async fn get_accepted_count_rank(
    db: &DatabaseConnection,
    problem_count: i64,
) -> Result<i64, DbErr> {
    let count = accepted_count::Entity::find()
        .filter(accepted_count::Column::ProblemCount.gt(problem_count as i32))
        .count(db)
        .await?;
    Ok(count as i64)
}

pub async fn load_rated_point_sum_in_range(
    db: &DatabaseConnection,
    offset: u64,
    limit: u64,
) -> Result<Vec<UserSum>, DbErr> {
    rated_point_sum::Entity::find()
        .order_by_desc(rated_point_sum::Column::PointSum)
        .order_by_asc(rated_point_sum::Column::UserId)
        .offset(offset)
        .limit(limit)
        .into_model::<UserSum>()
        .all(db)
        .await
}

pub async fn get_users_rated_point_sum(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<Option<i64>, DbErr> {
    let model = rated_point_sum::Entity::find()
        .filter(
            Expr::expr(Func::lower(Expr::col(rated_point_sum::Column::UserId)))
                .eq(user_id.to_lowercase()),
        )
        .one(db)
        .await?;
    Ok(model.map(|m| m.point_sum))
}

pub async fn get_rated_point_sum_rank(
    db: &DatabaseConnection,
    point_sum: i64,
) -> Result<i64, DbErr> {
    let count = rated_point_sum::Entity::find()
        .filter(rated_point_sum::Column::PointSum.gt(point_sum))
        .count(db)
        .await?;
    Ok(count as i64)
}

pub async fn load_streak_in_range(
    db: &DatabaseConnection,
    offset: u64,
    limit: u64,
) -> Result<Vec<UserStreak>, DbErr> {
    max_streaks::Entity::find()
        .order_by_desc(max_streaks::Column::Streak)
        .order_by_asc(max_streaks::Column::UserId)
        .offset(offset)
        .limit(limit)
        .into_model::<UserStreak>()
        .all(db)
        .await
}

pub async fn get_users_streak(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<Option<i64>, DbErr> {
    let model = max_streaks::Entity::find()
        .filter(
            Expr::expr(Func::lower(Expr::col(max_streaks::Column::UserId)))
                .eq(user_id.to_lowercase()),
        )
        .one(db)
        .await?;
    Ok(model.map(|m| m.streak))
}

pub async fn get_streak_rank(db: &DatabaseConnection, streak: i64) -> Result<i64, DbErr> {
    let count = max_streaks::Entity::find()
        .filter(max_streaks::Column::Streak.gt(streak))
        .count(db)
        .await?;
    Ok(count as i64)
}

pub async fn load_language_count_in_range(
    db: &DatabaseConnection,
    language: &str,
    offset: u64,
    limit: u64,
) -> Result<Vec<UserProblemCount>, DbErr> {
    language_count::Entity::find()
        .filter(language_count::Column::SimplifiedLanguage.eq(language))
        .order_by_desc(language_count::Column::ProblemCount)
        .order_by_asc(language_count::Column::UserId)
        .offset(offset)
        .limit(limit)
        .into_model::<UserProblemCount>()
        .all(db)
        .await
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct LanguageUserRank {
    pub simplified_language: String,
    pub problem_count: i32,
    pub rank: i64,
}

/// Return `(simplified_language, problem_count, rank)` for every language the user has used.
///
/// `rank` is the 1-based position within the language ordered by `problem_count` desc
/// (ties share the same rank). A self-join + COUNT + GROUP BY produces the same result
/// as the old `RANK()` window function. Built with sea-query so placeholders are emitted
/// correctly for both Postgres and SQLite.
pub async fn load_users_language_rank(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<Vec<LanguageUserRank>, DbErr> {
    let my = Alias::new("my");
    let higher = Alias::new("higher");
    let col_lang = language_count::Column::SimplifiedLanguage;
    let col_count = language_count::Column::ProblemCount;
    let col_user = language_count::Column::UserId;

    let query = Query::select()
        .expr_as(
            Expr::col((my.clone(), col_lang)),
            Alias::new("simplified_language"),
        )
        .expr_as(
            Expr::col((my.clone(), col_count)),
            Alias::new("problem_count"),
        )
        .expr_as(
            Expr::expr(Func::count(Expr::col((higher.clone(), col_user)))).add(1),
            Alias::new("rank"),
        )
        .from_as(language_count::Entity, my.clone())
        .join_as(
            JoinType::LeftJoin,
            language_count::Entity,
            higher.clone(),
            Expr::col((higher.clone(), col_lang))
                .eq(Expr::col((my.clone(), col_lang)))
                .and(Expr::col((higher.clone(), col_count)).gt(Expr::col((my.clone(), col_count))))
                .into_condition(),
        )
        .and_where(
            Expr::expr(Func::lower(Expr::col((my.clone(), col_user)))).eq(user_id.to_lowercase()),
        )
        .group_by_col((my.clone(), col_lang))
        .group_by_col((my.clone(), col_count))
        .order_by((my.clone(), col_lang), Order::Asc)
        .to_owned();

    let stmt = db.get_database_backend().build(&query);
    LanguageUserRank::find_by_statement(stmt).all(db).await
}

pub async fn load_languages(db: &DatabaseConnection) -> Result<Vec<String>, DbErr> {
    let rows = language_count::Entity::find()
        .select_only()
        .column(language_count::Column::SimplifiedLanguage)
        .distinct()
        .order_by_asc(language_count::Column::SimplifiedLanguage)
        .into_tuple::<String>()
        .all(db)
        .await?;
    Ok(rows)
}
