use super::AtCoderSubmission;

use crate::{Error, Result};

use chrono::DateTime;
use regex::Regex;
use scraper::{Html, Selector};

pub(super) fn scrape_submission_page_count(html: &str) -> Result<u32> {
    let selector = Selector::parse("a").unwrap();
    let re = Regex::new(r"page=\d+$").unwrap();
    Html::parse_document(&html)
        .select(&selector)
        .flat_map(|el| el.value().attr("href"))
        .filter(|href| re.is_match(href))
        .flat_map(|href| href.rsplit('=').next())
        .flat_map(str::parse)
        .max()
        .ok_or_else(|| Error::HtmlParseError)
}

pub(super) fn scrape(html_text: &str, contest_id: &str) -> Result<Vec<AtCoderSubmission>> {
    let tbody_selector = Selector::parse("tbody").unwrap();
    let tr_selector = Selector::parse("tr").unwrap();
    let td_selector = Selector::parse("td").unwrap();
    let a_selector = Selector::parse("a").unwrap();
    let re = Regex::new(r"submissions/\d+$").unwrap();

    Html::parse_document(&html_text)
        .select(&tbody_selector)
        .next()
        .ok_or_else(|| Error::HtmlParseError)?
        .select(&tr_selector)
        .map(|tr| {
            let mut tds = tr.select(&td_selector);

            let time = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?;
            let time = DateTime::parse_from_str(&time, "%Y-%m-%d %H:%M:%S%z")?;
            let epoch_second = time.timestamp() as u64;

            let problem_id = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .select(&a_selector)
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .value()
                .attr("href")
                .ok_or_else(|| Error::HtmlParseError)?
                .rsplit('/')
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .to_owned();

            let user_id = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .select(&a_selector)
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .value()
                .attr("href")
                .ok_or_else(|| Error::HtmlParseError)?
                .rsplit('/')
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .to_owned();

            let language = tds
                .next()
                .and_then(|t| t.text().next())
                .unwrap_or("")
                .to_owned();

            let point: f64 = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .parse()?;

            let length = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .replace("Byte", "")
                .trim()
                .parse::<u64>()?;

            let result = tds
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .text()
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .to_owned();

            let execution_time = tds
                .next()
                .and_then(|e| e.text().next())
                .map(|s| s.replace("ms", ""))
                .and_then(|s| s.trim().parse::<u64>().ok());

            let id = tr
                .select(&a_selector)
                .find(|e| match e.value().attr("href") {
                    Some(href) => re.is_match(href),
                    None => false,
                })
                .ok_or_else(|| Error::HtmlParseError)?
                .value()
                .attr("href")
                .ok_or_else(|| Error::HtmlParseError)?
                .rsplit('/')
                .next()
                .ok_or_else(|| Error::HtmlParseError)?
                .trim()
                .parse::<u64>()?;
            Ok(AtCoderSubmission {
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
        let mut file = File::open("test_resources/abc107_submissions").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let submissions = scrape(&contents, "abc107").unwrap();
        assert_eq!(submissions.len(), 20);
        assert!(submissions.iter().all(|s| s.user_id.is_ascii()));

        let max_page = scrape_submission_page_count(&contents).unwrap();
        assert_eq!(max_page, 818);
    }
}
