use crate::{Error, Result};

use super::AtCoderContest;

use std::io::prelude::*;
use std::fs::File;
use chrono::DateTime;
use scraper::{Html, Selector};

pub(super) fn scrape_normal(html: &str) -> Result<Vec<AtCoderContest>> {
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

pub(super) fn scrape_permanent(html: &str) -> Result<Vec<AtCoderContest>> {
    Html::parse_document(html)
        .select(&Selector::parse("#contest-table-permanent").unwrap())
        .next()
        .ok_or_else(|| Error::HtmlParseError)?
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or_else(|| Error::HtmlParseError)?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);

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

            let rated = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?;
            Ok(AtCoderContest {
                id: contest_id.to_owned(),
                start_epoch_second: 0,
                duration_second: std::i64::MAX as u64,
                title: contest_title.to_owned(),
                rate_change: rated.to_owned(),
            })
        })
        .collect()
}

pub(super) fn scrape_hidden() -> Result<Vec<AtCoderContest>> {
    let mut file = File::open("hidden_contest.json").unwrap();
    let mut hidden_contests = String::new();
    file.read_to_string(&mut hidden_contests).unwrap();

    println!("{}", hidden_contests);
    println!("{:?}", serde_json::from_str::<Vec<AtCoderContest>>(&hidden_contests));
    
    if let Ok(contests) = serde_json::from_str(&hidden_contests) {
        Ok(contests)
    } else {
        Err(Error::JsonParseError)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_scrape_normal() {
        let mut file = File::open("test_resources/contests_normal").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let contests = scrape_normal(&contents).unwrap();
        assert_eq!(contests.len(), 50);
    }

    #[test]
    fn test_scrape_permanent() {
        let mut file = File::open("test_resources/contests_permanent").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let contests = scrape_permanent(&contents).unwrap();
        assert_eq!(contests.len(), 4);
    }

    #[test]
    fn test_scrape_hidden() {
        let contests = scrape_hidden().unwrap();
        assert_eq!(contests.len(), 1);
    }
}
