use crate::scraper::ATCODER_HOST;
use crate::Contest;
use chrono::DateTime;
use reqwest::{header, Client};
use scraper::{Html, Selector};

pub fn scrape_contests(page: usize) -> Result<Vec<Contest>, String> {
    let url = format!("{}/contests/archive?lang=ja&page={}", ATCODER_HOST, page);
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
        .ok_or_else(|| url.clone())?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let start = tds
                .next()
                .ok_or_else(|| url.clone())?
                .text()
                .next()
                .ok_or_else(|| url.clone())?;
            let start = DateTime::parse_from_str(&start, "%Y-%m-%d %H:%M:%S%z")
                .map_err(|e| format!("{:?}", e))?;
            let start = start.timestamp();

            let contest = tds.next().ok_or_else(|| url.clone())?;
            let contest_title = contest.text().next().ok_or_else(|| url.clone())?;
            let contest_link = contest
                .select(&Selector::parse("a").unwrap())
                .next()
                .ok_or_else(|| url.clone())?
                .value()
                .attr("href")
                .ok_or_else(|| url.clone())?;
            let contest_id = contest_link.rsplit('/').next().ok_or_else(|| url.clone())?;

            let duration = tds.next().unwrap().text().next().unwrap();
            let mut duration = duration.split(':');
            let hours = duration
                .next()
                .ok_or_else(|| url.clone())?
                .parse::<i64>()
                .map_err(|e| format!("{:?}", e))?;
            let minutes = duration
                .next()
                .ok_or_else(|| url.clone())?
                .parse::<i64>()
                .map_err(|e| format!("{:?}", e))?;
            let duration = hours * 3600 + minutes * 60;
            let rated = tds
                .next()
                .ok_or_else(|| url.clone())?
                .text()
                .next()
                .ok_or_else(|| url.clone())?;
            Ok(Contest {
                id: contest_id.to_owned(),
                start_epoch_second: start,
                duration_second: duration,
                title: contest_title.to_owned(),
                rate_change: rated.to_owned(),
            })
        })
        .collect()
}
