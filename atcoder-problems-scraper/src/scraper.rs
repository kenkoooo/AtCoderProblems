pub(crate) const ATCODER_HOST: &str = "https://atcoder.jp";

pub mod contest;
pub mod problem;
pub mod submission;

pub use self::contest::scrape_contests;
pub use self::problem::scrape_problems;
pub use self::submission::{get_max_submission_page, scrape_submissions};

use reqwest::{header, Client};

pub(crate) fn get_html(url: &str) -> Result<String, String> {
    Client::new()
        .get(url)
        .header(header::ACCEPT, "text/html")
        .send()
        .map_err(|e| format!("{:?}", e))
        .and_then(|mut response| response.text().map_err(|e| format!("{:?}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Problem;
    use std::fs::File;
    use std::io::prelude::*;

    fn read_file(path: &str) -> String {
        let mut file = File::open(path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    #[test]
    fn test_submission_scraper() {
        let html = read_file("assets/abc107_submissions.html");

        let submissions = submission::scrape_submissions_from_html(&html, "abc107");
        assert_eq!(submissions.len(), 20);
        assert!(submissions.iter().all(|s| s.user_id.is_ascii()));

        let max_page = submission::get_max_submission_page_from_html(&html).unwrap();
        assert_eq!(max_page, 818);
    }

    #[test]
    fn test_problem_scraper() {
        let html = read_file("assets/abc107_tasks.html");
        let problems = problem::scrape_problems_from_html(&html, "abc107").unwrap();
        assert_eq!(
            problems,
            vec![
                Problem {
                    id: "abc107_a".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "Train".to_owned()
                },
                Problem {
                    id: "abc107_b".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "Grid Compression".to_owned()
                },
                Problem {
                    id: "arc101_a".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "Candles".to_owned()
                },
                Problem {
                    id: "arc101_b".to_owned(),
                    contest_id: "abc107".to_owned(),
                    title: "Median of Medians".to_owned()
                }
            ]
        );
    }
}
