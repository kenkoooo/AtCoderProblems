use crate::sql::models::Contest;
use chrono::DateTime;
use scraper::{Html, Selector};

pub(super) fn scrape(html: &str) -> Option<Vec<Contest>> {
    Html::parse_document(html)
        .select(&Selector::parse("tbody").unwrap())
        .next()?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let start = tds.next()?.text().next()?;
            let start = DateTime::parse_from_str(&start, "%Y-%m-%d %H:%M:%S%z").ok()?;
            let start = start.timestamp();

            let contest = tds.next()?;
            let contest_title = contest.text().next()?;
            let contest_link = contest
                .select(&Selector::parse("a").unwrap())
                .next()?
                .value()
                .attr("href")?;
            let contest_id = contest_link.rsplit('/').next()?;

            let duration = tds.next().unwrap().text().next().unwrap();
            let mut duration = duration.split(':');
            let hours = duration.next()?.parse::<i64>().ok()?;
            let minutes = duration.next()?.parse::<i64>().ok()?;
            let duration = hours * 3600 + minutes * 60;
            let rated = tds.next()?.text().next()?;
            Some(Contest {
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
        let mut file = File::open("assets/contests").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let contests = scrape(&contents).unwrap();
        assert_eq!(contests.len(), 50);
    }
}
