use crate::scraper::{get_html, ATCODER_HOST};
use crate::Submission;
use chrono::DateTime;
use regex::Regex;
use scraper::{Html, Selector};

pub(crate) fn get_max_submission_page_from_html(html: &str) -> Option<usize> {
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
                .rsplit("=")
                .next()
                .unwrap()
                .parse::<usize>()
                .unwrap()
        })
        .max()
}

pub fn get_max_submission_page(contest_id: &str) -> Result<usize, String> {
    let url = format!("{}/contests/{}/submissions", ATCODER_HOST, contest_id);
    let page_html = get_html(&url)?;
    get_max_submission_page_from_html(&page_html).ok_or(url.clone())
}

pub(crate) fn scrape_submissions_from_html(
    html_text: &str,
    contest_id: &str,
) -> Option<Vec<Submission>> {
    Html::parse_document(&html_text)
        .select(&Selector::parse("tbody").unwrap())
        .next()?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);

            let time = tds.next()?.text().next()?;
            let time = DateTime::parse_from_str(&time, "%Y-%m-%d %H:%M:%S%z").ok()?;
            let epoch_second = time.timestamp();

            let problem_id = tds
                .next()?
                .select(&Selector::parse("a").unwrap())
                .next()?
                .value()
                .attr("href")?
                .rsplit("/")
                .next()?
                .to_owned();

            let user_id = tds.next()?.text().next()?.to_owned();

            let language = tds.next()?.text().next()?.to_owned();

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
                .filter(|e| match e.value().attr("href") {
                    Some(href) => Regex::new(r"submissions/\d+$").unwrap().is_match(href),
                    None => false,
                })
                .next()?
                .value()
                .attr("href")
                .unwrap()
                .rsplit("/")
                .next()
                .unwrap()
                .trim()
                .parse::<u64>()
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

pub fn scrape_submissions(contest_id: &str, page: usize) -> Result<Vec<Submission>, String> {
    let url = format!(
        "{}/contests/{}/submissions?page={}",
        ATCODER_HOST, contest_id, page
    );
    let page_html = get_html(&url)?;
    scrape_submissions_from_html(&page_html, contest_id).ok_or_else(|| format!("Error: {}", url))
}
