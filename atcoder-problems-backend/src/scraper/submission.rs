use crate::sql::models::Submission;
use chrono::DateTime;
use regex::Regex;
use scraper::{Html, Selector};

pub(crate) fn scrape_submission_page_count(html: &str) -> Option<usize> {
    Html::parse_document(&html)
        .select(&Selector::parse("a").unwrap())
        .filter(|el| match el.value().attr("href") {
            Some(href) => Regex::new(r"page=\d+$").unwrap().is_match(href),
            None => false,
        })
        .map(|el| {
            el.value()
                .attr("href")
                .unwrap()
                .rsplit('=')
                .next()
                .unwrap()
                .parse::<usize>()
                .unwrap()
        })
        .max()
}

pub(super) fn scrape(html_text: &str, contest_id: &str) -> Option<Vec<Submission>> {
    let tbody_selector = Selector::parse("tbody").unwrap();
    let tr_selector = Selector::parse("tr").unwrap();
    let td_selector = Selector::parse("td").unwrap();
    let a_selector = Selector::parse("a").unwrap();
    Html::parse_document(&html_text)
        .select(&tbody_selector)
        .next()?
        .select(&tr_selector)
        .map(|tr| {
            let mut tds = tr.select(&td_selector);

            let time = tds.next()?.text().next()?;
            let time = DateTime::parse_from_str(&time, "%Y-%m-%d %H:%M:%S%z").ok()?;
            let epoch_second = time.timestamp();

            let problem_id = tds
                .next()?
                .select(&a_selector)
                .next()?
                .value()
                .attr("href")?
                .rsplit('/')
                .next()?
                .to_owned();

            let user_id = tds
                .next()?
                .select(&a_selector)
                .next()?
                .value()
                .attr("href")?
                .rsplit('/')
                .next()?
                .to_owned();

            let language = tds
                .next()
                .and_then(|t| t.text().next())
                .unwrap_or("")
                .to_owned();

            let point: f64 = tds.next()?.text().next()?.parse().ok()?;

            let length = tds
                .next()?
                .text()
                .next()?
                .replace("Byte", "")
                .trim()
                .parse::<i32>()
                .ok()?;

            let result = tds.next()?.text().next()?.to_owned();

            let execution_time = tds
                .next()
                .and_then(|e| e.text().next())
                .map(|s| s.replace("ms", ""))
                .and_then(|s| s.trim().parse::<i32>().ok());

            let id = tr
                .select(&Selector::parse("a").unwrap())
                .find(|e| match e.value().attr("href") {
                    Some(href) => Regex::new(r"submissions/\d+$").unwrap().is_match(href),
                    None => false,
                })?
                .value()
                .attr("href")
                .unwrap()
                .rsplit('/')
                .next()
                .unwrap()
                .trim()
                .parse::<i64>()
                .unwrap();
            Some(Submission {
                id,
                epoch_second,
                problem_id,
                contest_id: contest_id.to_owned(),
                user_id,
                language,
                point,
                length,
                result,
                execution_time,
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
        let mut file = File::open("assets/abc107_submissions").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        let submissions = scrape(&contents, "abc107").unwrap();
        assert_eq!(submissions.len(), 20);
        assert!(submissions.iter().all(|s| s.user_id.is_ascii()));

        let max_page = scrape_submission_page_count(&contents).unwrap();
        assert_eq!(max_page, 818);
    }
}
