use crate::error::Result;

use crate::crawler::Fetcher;
use crate::sql::{SubmissionClient, SubmissionRequest};
use diesel::dsl::*;
use diesel::pg::upsert::excluded;
use diesel::prelude::*;
use diesel::PgConnection;
use std::collections::{BTreeMap, BTreeSet};

pub(crate) struct FixCrawler<C, F> {
    db: C,
    fetcher: F,
}

impl<C, F> FixCrawler<C, F>
where
    C: SubmissionClient,
    F: Fetcher,
{
    fn crawl(&self) -> Result<()> {
        let submissions = self
            .db
            .get_submissions(SubmissionRequest::InvalidResult { from_second: 1 })?;
        let contests = submissions.into_iter().map(|s| (s.contest_id, s.id)).fold(
            BTreeMap::new(),
            |mut map, (contest_id, id)| {
                let cur_id = map.entry(contest_id).or_insert(id);
                if *cur_id > id {
                    *cur_id = id;
                }
                map
            },
        );

        for (contest_id, minimum_id) in contests.into_iter() {
            for page in 1.. {
                let (submissions, num) = self.fetcher.fetch_submissions(&contest_id, page)?;
                if num == page {
                    break;
                }
                self.db.update_submissions(&submissions)?;
                if submissions.iter().any(|s| s.id == minimum_id) {
                    break;
                }
            }
        }

        Ok(())
    }
}
