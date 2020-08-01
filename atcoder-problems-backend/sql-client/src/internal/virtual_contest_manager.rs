use crate::PgPool;
use anyhow::{bail, Result};
use async_trait::async_trait;
use serde::Serialize;
use sqlx::postgres::PgRow;
use sqlx::Row;
use std::result::Result as StdResult;
use uuid::Uuid;

const MAX_PROBLEM_NUM_PER_CONTEST: usize = 100;
const RECENT_CONTEST_NUM: i64 = 1000;

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct VirtualContestInfo {
    pub id: String,
    pub title: String,
    pub memo: String,
    pub owner_user_id: String, // field name is `internal_user_id`
    pub start_epoch_second: i64,
    pub duration_second: i64,
    pub mode: Option<String>,
    pub is_public: bool,
    pub penalty_second: i64,
}

fn virtual_contest_info_mapper(row: PgRow) -> StdResult<VirtualContestInfo, sqlx::Error> {
    let id: String = row.try_get("id")?;
    let title: String = row.try_get("title")?;
    let memo: String = row.try_get("memo")?;
    let owner_user_id: String = row.try_get("internal_user_id")?;
    let start_epoch_second: i64 = row.try_get("start_epoch_second")?;
    let duration_second: i64 = row.try_get("duration_second")?;
    let mode: Option<String> = row.try_get("mode")?;
    let is_public: bool = row.try_get("is_public")?;
    let penalty_second: i64 = row.try_get("penalty_second")?;
    Ok(VirtualContestInfo {
        id,
        title,
        memo,
        owner_user_id,
        start_epoch_second,
        duration_second,
        mode,
        is_public,
        penalty_second,
    })
}

#[derive(Serialize, Debug, PartialEq, Eq)]
pub struct VirtualContestItem {
    pub id: String,
    pub point: Option<i64>,
    pub order: Option<i64>,
}

#[async_trait]
pub trait VirtualContestManager {
    async fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
        penalty_second: i64,
    ) -> Result<String>;
    async fn update_contest(
        &self,
        id: &str,
        title: &str,
        memo: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
        penalty_second: i64,
    ) -> Result<()>;

    async fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContestInfo>>;
    async fn get_participated_contests(
        &self,
        internal_user_id: &str,
    ) -> Result<Vec<VirtualContestInfo>>;
    async fn get_single_contest_info(&self, contest_id: &str) -> Result<VirtualContestInfo>;
    async fn get_single_contest_participants(&self, contest_id: &str) -> Result<Vec<String>>;
    async fn get_single_contest_problems(
        &self,
        contest_id: &str,
    ) -> Result<Vec<VirtualContestItem>>;
    async fn get_recent_contest_info(&self) -> Result<Vec<VirtualContestInfo>>;
    async fn get_running_contest_problems(&self, time: i64) -> Result<Vec<String>>;

    async fn update_items(
        &self,
        contest_id: &str,
        problems: &[VirtualContestItem],
        user_id: &str,
    ) -> Result<()>;

    async fn join_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()>;
    async fn leave_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()>;
}

#[async_trait]
impl VirtualContestManager for PgPool {
    async fn create_contest(
        &self,
        title: &str,
        memo: &str,
        internal_user_id: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
        penalty_second: i64,
    ) -> Result<String> {
        let uuid = Uuid::new_v4().to_string();
        sqlx::query(
            r"
            INSERT INTO internal_virtual_contests
            VALUES (id, title, memo, internal_user_id, start_epoch_second, duration_second, mode, is_public, penalty_second)
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ",
        )
        .bind(&uuid)
        .bind(title)
        .bind(memo)
        .bind(internal_user_id)
        .bind(start_epoch_second)
        .bind(duration_second)
        .bind(mode)
        .bind(is_public)
        .bind(penalty_second)
        .execute(self).await?;
        Ok(uuid)
    }

    async fn update_contest(
        &self,
        id: &str,
        title: &str,
        memo: &str,
        start_epoch_second: i64,
        duration_second: i64,
        mode: Option<&str>,
        is_public: bool,
        penalty_second: i64,
    ) -> Result<()> {
        sqlx::query(
            r"
            UPDATE internal_virtual_contests
            SET
                title = $1,
                memo = $2,
                start_epoch_second = $3,
                duration_second = $4,
                mode = $5,
                is_public = $6,
                penalty_second = $7
            WHERE id = $8
            ",
        )
        .bind(title)
        .bind(memo)
        .bind(start_epoch_second)
        .bind(duration_second)
        .bind(mode)
        .bind(is_public)
        .bind(penalty_second)
        .bind(id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn get_own_contests(&self, internal_user_id: &str) -> Result<Vec<VirtualContestInfo>> {
        let data = sqlx::query(
            r"
            SELECT 
                id,
                title,
                memo,
                internal_user_id,
                start_epoch_second,
                duration_second,
                mode,
                is_public,
                penalty_second
            FROM internal_virtual_contests
            WHERE internal_user_id = $1
            ",
        )
        .bind(internal_user_id)
        .try_map(virtual_contest_info_mapper)
        .fetch_all(self)
        .await?;
        Ok(data)
    }

    async fn get_participated_contests(
        &self,
        internal_user_id: &str,
    ) -> Result<Vec<VirtualContestInfo>> {
        let data = sqlx::query(
            r"
            SELECT 
                a.id,
                a.title,
                a.memo,
                a.internal_user_id,
                a.start_epoch_second,
                a.duration_second,
                a.mode,
                a.is_public,
                a.penalty_second
            FROM internal_virtual_contests AS a
            LEFT JOIN internal_virtual_contest_participants AS b
            ON a.id = b.internal_virtual_contest_id
            WHERE b.internal_user_id = $1
            ",
        )
        .bind(internal_user_id)
        .try_map(virtual_contest_info_mapper)
        .fetch_all(self)
        .await?;
        Ok(data)
    }

    async fn get_single_contest_info(&self, contest_id: &str) -> Result<VirtualContestInfo> {
        sqlx::query(
            r"
            SELECT
                id,
                title,
                memo,
                internal_user_id,
                start_epoch_second,
                duration_second,
                mode,
                is_public,
                penalty_second
            FROM internal_virtual_contests
            WHERE id = $1
            ",
        )
        .bind(contest_id)
        .try_map(virtual_contest_info_mapper)
        .fetch_one(self)
        .await
        .map_err(|e| e.into())
    }

    async fn get_single_contest_participants(&self, contest_id: &str) -> Result<Vec<String>> {
        let participants = sqlx::query(
            r"
            SELECT 
                b.atcoder_user_id
            FROM (
                SELECT internal_user_id
                FROM internal_virtual_contest_participants
                WHERE internal_virtual_contest_id = $1
            ) AS a
            LEFT JOIN internal_users AS b
            ON a.internal_user_id = b.internal_user_id
            WHERE b.atcoder_user_id IS NOT NULL
            ORDER BY b.atcoder_user_id ASC
            ",
        )
        .bind(contest_id)
        .try_map(|row: PgRow| row.try_get::<Option<String>, _>("atcoder_user_id"))
        .fetch_all(self)
        .await?
        .into_iter()
        .filter_map(|participant| participant)
        .collect::<Vec<String>>();

        Ok(participants)
    }

    async fn get_single_contest_problems(
        &self,
        contest_id: &str,
    ) -> Result<Vec<VirtualContestItem>> {
        let problems = sqlx::query(
            r"
            SELECT problem_id, user_defined_point, user_defined_order
            FROM internal_virtual_contest_items
            WHERE internal_virtual_contest_id = $1
            ORDER BY user_defined_order ASC, problem_id ASC
            ",
        )
        .bind(contest_id)
        .try_map(|row: PgRow| {
            let id: String = row.try_get("problem_id")?;
            let point: Option<i64> = row.try_get("user_defined_point")?;
            let order: Option<i64> = row.try_get("user_defined_order")?;
            Ok(VirtualContestItem { id, point, order })
        })
        .fetch_all(self)
        .await?;

        Ok(problems)
    }

    async fn get_recent_contest_info(&self) -> Result<Vec<VirtualContestInfo>> {
        sqlx::query(
            r"
            SELECT 
                id,
                title,
                memo,
                internal_user_id,
                start_epoch_second,
                duration_second,
                mode,
                is_public,
                penalty_second
            FROM internal_virtual_contests
            WHERE is_public IS TRUE
            ORDER BY start_epoch_second + duration_second DESC
            LIMIT $1
            ",
        )
        .bind(RECENT_CONTEST_NUM)
        .try_map(virtual_contest_info_mapper)
        .fetch_all(self)
        .await
        .map_err(|e| e.into())
    }

    async fn get_running_contest_problems(&self, time: i64) -> Result<Vec<String>> {
        sqlx::query(
            r"
            SELECT problem_id
            FROM internal_virtual_contest_items AS a
            LEFT JOIN internal_virtual_contests AS b
            ON a.internal_virtual_contest_id = b.id
            WHERE b.start_epoch_second <= $1
            AND b.start_epoch_second + b.duration_second >= $1
            ",
        )
        .bind(time)
        .try_map(|row: PgRow| row.try_get::<String, _>("problem_id"))
        .fetch_all(self)
        .await
        .map_err(|e| e.into())
    }

    async fn update_items(
        &self,
        contest_id: &str,
        problems: &[VirtualContestItem],
        user_id: &str,
    ) -> Result<()> {
        if problems.len() > MAX_PROBLEM_NUM_PER_CONTEST {
            bail!("The number of problems exceeded.");
        }

        sqlx::query(
            r"
            SELECT COUNT(*) AS cnt
            FROM internal_virtual_contests
            WHERE internal_user_id = $1
            AND id = $2
            ",
        )
        .bind(user_id)
        .bind(contest_id)
        .try_map(|row: PgRow| row.try_get::<u32, _>("cnt"))
        .fetch_one(self)
        .await?;

        let (contest_ids, problem_ids, points, orders) = problems.iter().fold(
            (vec![], vec![], vec![], vec![]),
            |(mut contest_ids, mut problem_ids, mut points, mut orders), cur| {
                contest_ids.push(contest_id);
                problem_ids.push(cur.id.as_str());
                points.push(cur.point);
                orders.push(cur.order);
                (contest_ids, problem_ids, points, orders)
            },
        );

        let mut tx = self.begin().await?;

        sqlx::query(
            r"
            DELETE FROM internal_virtual_contest_items
            WHERE internal_virtual_contest_id = $1
            ",
        )
        .bind(contest_id)
        .execute(&mut tx)
        .await?;

        // The following is a trick for bulk-inserting.
        // See: https://github.com/launchbadge/sqlx/issues/571
        sqlx::query(
            r"
            INSERT INTO internal_virtual_contest_items
            (internal_virtual_contest_id, problem_id, user_defined_point, user_defined_order)
            VALUES (
                UNNEST($1::VARCHAR(255)[]),
                UNNEST($2::VARCHAR(255)[]),
                UNNEST($3::BIGINT[]}),
                UNNEST($4::BIGINT[]}),
            )
            ",
        )
        .bind(contest_ids)
        .bind(problem_ids)
        .bind(points)
        .bind(orders)
        .execute(&mut tx)
        .await?;

        tx.commit().await?;

        Ok(())
    }

    async fn join_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()> {
        sqlx::query(
            r"
            INSERT INTO internal_virtual_contest_participants
            (internal_virtual_contest_id, internal_user_id)
            VALUES ($1, $2)
            ",
        )
        .bind(contest_id)
        .bind(internal_user_id)
        .execute(self)
        .await?;
        Ok(())
    }

    async fn leave_contest(&self, contest_id: &str, internal_user_id: &str) -> Result<()> {
        sqlx::query(
            r"
            DELETE FROM internal_virtual_contest_participants
            WHERE internal_virtual_contest_id = $1
            AND internal_user_id = $2
            ",
        )
        .bind(contest_id)
        .bind(internal_user_id)
        .execute(self)
        .await?;
        Ok(())
    }
}
