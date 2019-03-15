use crate::scraper::ATCODER_HOST;
use crate::Problem;
use reqwest::{header, Client};
use scraper::{Html, Selector};

pub fn scrape_problems(contest_id: &str) -> Result<Vec<Problem>, String> {
    let url = format!("{}/contests/{}/tasks", ATCODER_HOST, contest_id);
    let client = Client::new();
    let mut res = client
        .get(&url)
        .header(header::ACCEPT, "text/html")
        .send()
        .map_err(|e| format!("{:?}", e))?;
    let page_html = res.text().map_err(|e| format!("{:?}", e))?;

    Html::parse_document(&page_html)
        .select(&Selector::parse("tbody").unwrap())
        .next()
        .ok_or(url.clone())?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let problem = tds.nth(1).ok_or(url.clone())?;
            let id = problem
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or(url.clone())?
                .value()
                .attr("href")
                .ok_or(url.clone())?
                .rsplit("/")
                .next()
                .ok_or(url.clone())?
                .to_owned();
            let title = problem.text().next().ok_or(url.clone())?.to_owned();
            Ok(Problem {
                id: id,
                contest_id: contest_id.to_owned(),
                title,
            })
        })
        .collect()
}
