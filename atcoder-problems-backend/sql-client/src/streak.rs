use crate::models::Submission;
use crate::{PgPool, MAX_INSERT_ROWS};
use anyhow::Result;
use async_trait::async_trait;

use chrono::Duration;
use chrono::{DateTime, Datelike, FixedOffset, TimeZone, Utc};
use std::cmp;
use std::collections::BTreeMap;

#[async_trait]
pub trait StreakUpdater {
    async fn update_streak_count(&self, submissions: &[Submission]) -> Result<()>;
}

#[async_trait]
impl StreakUpdater for PgPool {
    async fn update_streak_count(&self, ac_submissions: &[Submission]) -> Result<()> {
        let mut submissions = ac_submissions
            .iter()
            .map(|s| {
                (
                    Utc.timestamp(s.epoch_second, 0),
                    s.user_id.as_str(),
                    s.problem_id.as_str(),
                )
            })
            .collect::<Vec<_>>();
        submissions.sort_by_key(|&(timestamp, _, _)| timestamp);
        let first_ac_map = submissions.into_iter().fold(
            BTreeMap::new(),
            |mut map, (epoch_second, user_id, problem_id)| {
                map.entry(user_id)
                    .or_insert_with(BTreeMap::new)
                    .entry(problem_id)
                    .or_insert(epoch_second);
                map
            },
        );

        let user_max_streak = first_ac_map
            .into_iter()
            .map(|(user_id, m)| {
                let max_streak = get_max_streak(m.into_iter().map(|(_, utc)| utc).collect());
                (user_id, max_streak)
            })
            .collect::<Vec<_>>();

        for chunk in user_max_streak.chunks(MAX_INSERT_ROWS) {
            let (user_ids, max_streaks): (Vec<&str>, Vec<i64>) = chunk.iter().copied().unzip();
            sqlx::query(
                r"
                INSERT INTO max_streaks (user_id, streak)
                VALUES (
                    UNNEST($1::VARCHAR(255)[]),
                    UNNEST($2::BIGINT[])
                )
                ON CONFLICT (user_id)
                DO UPDATE SET streak = EXCLUDED.streak
                ",
            )
            .bind(user_ids)
            .bind(max_streaks)
            .execute(self)
            .await?;
        }

        Ok(())
    }
}

fn get_max_streak<Tz: TimeZone>(mut v: Vec<DateTime<Tz>>) -> i64 {
    v.sort();
    let (_, max_streak) = (1..v.len()).fold((1, 1), |(current_streak, max_streak), i| {
        if v[i - 1].is_same_day_in_jst(&v[i]) {
            (current_streak, max_streak)
        } else if (v[i - 1].clone() + Duration::days(1)).is_same_day_in_jst(&v[i]) {
            (current_streak + 1, cmp::max(max_streak, current_streak + 1))
        } else {
            (1, max_streak)
        }
    });
    max_streak
}

trait AsJst {
    fn as_jst(&self) -> DateTime<FixedOffset>;
    fn is_same_day_in_jst<T: TimeZone>(&self, rhs: &DateTime<T>) -> bool {
        let d1 = self.as_jst();
        let d2 = rhs.as_jst();
        d1.day() == d2.day() && d1.month() == d2.month() && d1.year() == d2.year()
    }
}

impl<Tz> AsJst for DateTime<Tz>
where
    Tz: TimeZone,
{
    fn as_jst(&self) -> DateTime<FixedOffset> {
        self.with_timezone(&FixedOffset::east(9 * 3600))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Datelike;

    #[test]
    fn test_to_jst() {
        let dt_10_04 = Utc.timestamp(1570114800, 0); //2019-10-04T00:00:00+09:00
        assert_eq!(dt_10_04.as_jst().day(), 04);

        let dt_10_03 = Utc.timestamp(1570114799, 0); //2019-10-03T23:59:59+09:00
        assert_eq!(dt_10_03.as_jst().day(), 03);

        let tomorrow = dt_10_03 + Duration::days(1);
        assert!((tomorrow).is_same_day_in_jst(&dt_10_04));
    }

    #[test]
    fn test_get_max_streak() {
        let v = vec![
            "2014-11-28T17:00:09+09:00",
            "2014-11-28T18:00:09+09:00",
            "2014-11-28T19:00:09+09:00",
            "2014-11-28T20:00:09+09:00",
            "2014-11-28T21:00:09+09:00",
            "2014-11-28T22:00:09+09:00",
            "2014-11-28T23:00:09+09:00",
            "2014-11-28T23:59:59+09:00",
            "2014-12-04T23:59:59+09:00",
            "2014-12-02T23:59:59+09:00",
            "2014-12-03T23:59:59+09:00",
            "2014-12-01T23:59:59+09:00",
        ]
        .into_iter()
        .map(|s| s.parse::<DateTime<Utc>>().unwrap())
        .collect::<Vec<_>>();
        let streak = get_max_streak(v);
        assert_eq!(streak, 4);
    }
}
