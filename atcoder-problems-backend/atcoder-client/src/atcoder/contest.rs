use crate::{Error, Result};

use super::AtCoderContest;

use chrono::DateTime;
use scraper::{Html, Selector};

pub(super) fn scrape(html: &str) -> Result<Vec<AtCoderContest>> {
    Html::parse_document(html)
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or_else(|| Error::HtmlParseError)?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let start = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?;
            let start = DateTime::parse_from_str(&start, "%Y-%m-%d %H:%M:%S%z")?;
            let start = start.timestamp() as u64;

            let contest = tds.next().ok_or_else(|| Error::HtmlParseError)?;
            let contest_title = contest.select(&Selector::parse("a").unwrap()).next().ok_or_else(|| Error::HtmlParseError)?.text().next().ok_or_else(|| Error::HtmlParseError)?;
            let contest_link = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .value()
                .attr("href")
                .ok_or_else(|| Error::HtmlParseError)?;
            let contest_id = contest_link
                .rsplit('/')
                .next()
                .ok_or_else(|| Error::HtmlParseError)?;

            let duration = tds.next().unwrap().text().next().unwrap();
            let mut duration = duration.split(':');
            let hours = duration
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .parse::<u64>()?;
            let minutes = duration
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .parse::<u64>()?;
            let duration = hours * 3600 + minutes * 60;
            let rated = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?;
            Ok(AtCoderContest {
                id: contest_id.to_owned(),
                start_epoch_second: start,
                duration_second: duration,
                title: contest_title.to_owned(),
                rate_change: rated.to_owned(),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::prelude::*;

    #[test]
    fn test_scrape() {
        let mut file = File::open("test_resources/contests").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let contests = scrape(&contents).unwrap();
        assert_eq!(contests.len(), 50);
    }
}
