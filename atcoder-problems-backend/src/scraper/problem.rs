use crate::sql::models::Problem;
use scraper::{Html, Selector};

pub(super) fn scrape(html: &str, contest_id: &str) -> Option<Vec<Problem>> {
    Html::parse_document(html)
        .select(&Selector::parse("tbody").unwrap())
        .next()?
        .select(&Selector::parse("tr").unwrap())
        .map(|tr| {
            let selector = Selector::parse("td").unwrap();
            let mut tds = tr.select(&selector);
            let prefix = tds.next()?.text().next()?.to_owned();
            let problem = tds.next()?;
            let id = problem
                .select(&Selector::parse("a").unwrap())
                .next()?
                .value()
                .attr("href")?
                .rsplit('/')
                .next()?
                .to_owned();
            let title = problem.text().next()?;
            Some(Problem {
                id,
                contest_id: contest_id.to_owned(),
                title: prefix + ". " + title,
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
        let mut file = File::open("assets/abc107_tasks").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        let problems = scrape(&contents, "abc107").unwrap();
        assert_eq!(
            problems,
            vec![
                Problem {
                    id: "abc107_a".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "A. Train".to_owned()
                },
                Problem {
                    id: "abc107_b".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "B. Grid Compression".to_owned()
                },
                Problem {
                    id: "arc101_a".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "C. Candles".to_owned()
                },
                Problem {
                    id: "arc101_b".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "D. Median of Medians".to_owned()
                }
            ]
        );
    }
}
