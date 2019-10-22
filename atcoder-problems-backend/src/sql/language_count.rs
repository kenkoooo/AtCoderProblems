use super::models::{Submission, UserLanguageCount};
use super::schema::language_count;
use super::MAX_INSERT_ROWS;
use crate::error::Result;
use crate::utils::SplitToSegments;

use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::PgConnection;
use regex::Regex;
use std::collections::{BTreeMap, BTreeSet};

pub trait LanguageCountClient {
    fn update_language_count(&self, submissions: &[Submission]) -> Result<()>;
    fn load_language_count(&self) -> Result<Vec<UserLanguageCount>>;
}

impl LanguageCountClient for PgConnection {
    fn update_language_count(&self, submissions: &[Submission]) -> Result<()> {
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
                        .or_insert_with(BTreeSet::new)
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

        for segment in language_count
            .split_into_segments(MAX_INSERT_ROWS)
            .into_iter()
        {
            insert_into(language_count::table)
                .values(segment)
                .on_conflict((language_count::user_id, language_count::simplified_language))
                .do_update()
                .set(language_count::problem_count.eq(excluded(language_count::problem_count)))
                .execute(self)?;
        }
        Ok(())
    }

    fn load_language_count(&self) -> Result<Vec<UserLanguageCount>> {
        let count = language_count::table
            .order_by(language_count::user_id)
            .load::<UserLanguageCount>(self)?;
        Ok(count)
    }
}
