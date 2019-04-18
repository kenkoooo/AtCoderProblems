use atcoder_problems_sql_common::models::Submission;
use atcoder_problems_sql_common::schema::*;
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use regex::Regex;
use std::collections::{BTreeMap, BTreeSet};

const FIRST_AGC_EPOCH_SECOND: i64 = 1468670400;
const UNRATED_CONTEST_LABEL: &str = "-";

pub trait DeltaUpdater {
    fn get_recent_submissions(&self, num: i64) -> QueryResult<Vec<Submission>>;
    fn get_user_submissions(&self, submissions: &[Submission]) -> QueryResult<Vec<Submission>>;

    fn delta_update_rated_point_sum(&self, submissions: &[Submission]) -> QueryResult<usize>;
    fn delta_update_accepted_count(&self, submissions: &[Submission]) -> QueryResult<usize>;
    fn delta_update_language_count(&self, submissions: &[Submission]) -> QueryResult<usize>;
}

impl DeltaUpdater for PgConnection {
    fn get_recent_submissions(&self, num: i64) -> QueryResult<Vec<Submission>> {
        submissions::table
            .filter(submissions::result.eq("AC"))
            .order(submissions::id.desc())
            .limit(num)
            .load(self)
    }

    fn get_user_submissions(&self, submissions: &[Submission]) -> QueryResult<Vec<Submission>> {
        let users: BTreeSet<&str> = submissions.iter().map(|s| s.user_id.as_str()).collect();
        submissions::table
            .filter(submissions::result.eq("AC"))
            .filter(submissions::user_id.eq_any(users))
            .load(self)
    }

    fn delta_update_accepted_count(&self, submissions: &[Submission]) -> QueryResult<usize> {
        let accepted_count = submissions
            .iter()
            .map(|s| (s.user_id.as_str(), s.problem_id.as_str()))
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id)| {
                map.entry(user_id)
                    .or_insert(BTreeSet::new())
                    .insert(problem_id);
                map
            })
            .into_iter()
            .map(|(user_id, set)| {
                (
                    accepted_count::user_id.eq(user_id),
                    accepted_count::problem_count.eq(set.len() as i32),
                )
            })
            .collect::<Vec<_>>();
        insert_into(accepted_count::table)
            .values(accepted_count)
            .on_conflict(accepted_count::user_id)
            .do_update()
            .set(accepted_count::problem_count.eq(excluded(accepted_count::problem_count)))
            .execute(self)
    }

    fn delta_update_language_count(&self, submissions: &[Submission]) -> QueryResult<usize> {
        let re = Regex::new(r"\d* \(.*\)").unwrap();
        let language_count = submissions
            .iter()
            .map(|s| {
                (
                    s.user_id.as_str(),
                    s.problem_id.as_str(),
                    s.language.as_str(),
                )
            })
            .fold(
                BTreeMap::new(),
                |mut map, (user_id, problem_id, language)| {
                    let simplified_language = if language.len() >= 5 && &language[..5] == "Perl6" {
                        "Perl6".to_string()
                    } else {
                        re.replace(&language, "").to_string()
                    };
                    map.entry((user_id, simplified_language))
                        .or_insert(BTreeSet::new())
                        .insert(problem_id);
                    map
                },
            )
            .into_iter()
            .map(|((user_id, language), set)| {
                (
                    language_count::user_id.eq(user_id),
                    language_count::simplified_language.eq(language),
                    language_count::problem_count.eq(set.len() as i32),
                )
            })
            .collect::<Vec<_>>();

        insert_into(language_count::table)
            .values(language_count)
            .on_conflict((language_count::user_id, language_count::simplified_language))
            .do_update()
            .set(language_count::problem_count.eq(excluded(language_count::problem_count)))
            .execute(self)
    }

    fn delta_update_rated_point_sum(&self, submissions: &[Submission]) -> QueryResult<usize> {
        let rated_contest_ids = contests::table
            .filter(contests::start_epoch_second.gt(FIRST_AGC_EPOCH_SECOND))
            .filter(contests::rate_change.ne(UNRATED_CONTEST_LABEL))
            .select(contests::id)
            .load::<String>(self)?
            .into_iter()
            .collect::<BTreeSet<_>>();

        let rated_point_sum = submissions
            .iter()
            .filter(|s| rated_contest_ids.contains(&s.contest_id))
            .map(|s| (s.user_id.as_str(), s.problem_id.as_str(), s.point))
            .fold(BTreeMap::new(), |mut map, (user_id, problem_id, point)| {
                map.entry(user_id)
                    .or_insert(BTreeSet::new())
                    .insert((problem_id, point as u32));
                map
            })
            .into_iter()
            .map(|(user_id, set)| {
                let sum = set.into_iter().map(|(_, point)| point).sum::<u32>();
                (
                    rated_point_sum::user_id.eq(user_id),
                    rated_point_sum::point_sum.eq(sum as f64),
                )
            })
            .collect::<Vec<_>>();
        insert_into(rated_point_sum::table)
            .values(rated_point_sum)
            .on_conflict(rated_point_sum::user_id)
            .do_update()
            .set(rated_point_sum::point_sum.eq(excluded(rated_point_sum::point_sum)))
            .execute(self)
    }
}
