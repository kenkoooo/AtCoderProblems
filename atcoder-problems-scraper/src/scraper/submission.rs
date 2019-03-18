use crate::scraper::{get_html, ATCODER_HOST};
use crate::Submission;
use chrono::DateTime;
use regex::Regex;
use scraper::{Html, Selector};

pub fn get_max_submission_page(contest_id: &str) -> Result<usize, String> {
    let url = format!("{}/contests/{}/submissions", ATCODER_HOST, contest_id);
    let page_html = get_html(&url)?;

    Html::parse_document(&page_html)
        .select(&Selector::parse("a").unwrap())
        .filter(|el| match el.value().attr("href") {
            Some(href) => Regex::new(r"page=\d+$").unwrap().is_match(href),
            None => false,
        })
        .map(|el| {
            el.value()
                .attr("href")
                .unwrap()
                .rsplit("=")
                .next()
                .unwrap()
                .parse::<usize>()
                .unwrap()
        })
        .max()
        .ok_or(url.clone())
}

pub fn scrape_submissions(contest_id: &str, page: usize) -> Result<Vec<Submission>, String> {
    let url = format!(
        "{}/contests/{}/submissions?page={}",
        ATCODER_HOST, contest_id, page
    );
    let page_html = get_html(&url)?;

    Html::parse_document(&page_html)
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or(url.clone())?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);

            let time = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?;
            let time = DateTime::parse_from_str(&time, "%Y-%m-%d %H:%M:%S%z")
                .map_err(|e| format!("{:?}", e))?;
            let epoch_second = time.timestamp();

            let problem_id = tds
                .next()
                .ok_or(url.clone())?
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or(url.clone())?
                .value()
                .attr("href")
                .ok_or(url.clone())?
                .rsplit("/")
                .next()
                .ok_or("c".to_owned())?
                .to_owned();

            let user_id = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?
                .to_owned();

            let language = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?
                .to_owned();

            let point: f64 = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?
                .parse()
                .map_err(|e| format!("{:?}", e))?;

            let length = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?
                .replace("Byte", "")
                .trim()
                .parse::<i32>()
                .map_err(|e| format!("{:?}", e))?;

            let result = tds
                .next()
                .ok_or(url.clone())?
                .text()
                .next()
                .ok_or(url.clone())?
                .to_owned();

            let execution_time = tds
                .next()
                .and_then(|e| e.text().next())
                .map(|s| s.replace("ms", ""))
                .and_then(|s| s.trim().parse::<i32>().ok());

            let id = tr
                .select(&Selector::parse("a").unwrap())
                .filter(|e| match e.value().attr("href") {
                    Some(href) => Regex::new(r"submissions/\d+$").unwrap().is_match(href),
                    None => false,
                })
                .next()
                .ok_or(url.clone())?
                .value()
                .attr("href")
                .unwrap()
                .rsplit("/")
                .next()
                .unwrap()
                .trim()
                .parse::<u64>()
                .unwrap();
            Ok(Submission {
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
