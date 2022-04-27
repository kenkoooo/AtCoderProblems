use anyhow::{anyhow, Result};

use super::AtCoderContest;

use chrono::DateTime;
use scraper::{Html, Selector};

const PERMANENT_CONTEST_DURATION_SECOND: u64 = 100 * 365 * 24 * 3600;

pub(super) fn scrape_normal(html: &str) -> Result<Vec<AtCoderContest>> {
    Html::parse_document(html)
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or_else(|| anyhow!("Failed to parse html."))?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let start = tds
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .text()
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            let start = DateTime::parse_from_str(start, "%Y-%m-%d %H:%M:%S%z")?;
            let start = start.timestamp() as u64;

            let contest = tds.next().ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_title = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .text()
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_link = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .value()
                .attr("href")
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_id = contest_link
                .rsplit('/')
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;

            let duration = tds.next().unwrap().text().next().unwrap();
            let mut duration = duration.split(':');
            let hours = duration
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .parse::<u64>()?;
            let minutes = duration
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .parse::<u64>()?;
            let duration = hours * 3600 + minutes * 60;
            let rated = tds
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .text()
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
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
        .ok_or_else(|| anyhow!("Failed to parse html."))?
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or_else(|| anyhow!("Failed to parse html."))?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);

            let contest = tds.next().ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_title = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .text()
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_link = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .value()
                .attr("href")
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            let contest_id = contest_link
                .rsplit('/')
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;

            let rated = tds
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?
                .text()
                .next()
                .ok_or_else(|| anyhow!("Failed to parse html."))?;
            Ok(AtCoderContest {
                id: contest_id.to_owned(),
                start_epoch_second: 0,
                duration_second: PERMANENT_CONTEST_DURATION_SECOND,
                title: contest_title.to_owned(),
                rate_change: rated.to_owned(),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scrape_normal() {
        let contents = include_str!("../../test_resources/contests_normal");

        let contests = scrape_normal(contents).unwrap();
        assert_eq!(contests.len(), 50);
    }

    #[test]
    fn test_scrape_permanent() {
        let contents = include_str!("../../test_resources/contests_permanent");

        let contests = scrape_permanent(contents).unwrap();
        assert_eq!(contests.len(), 4);
    }
}
