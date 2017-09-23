use regex::Regex;
use reqwest;
use select::document::Document;
use select::predicate::{Predicate, Attr, Class, Name};
use std::io::Read;
use serde_json;
use serde_json::{Value, Error};


fn request_html_string(url: &str) -> String {
    let mut resp = reqwest::get(url).unwrap();
    assert!(resp.status().is_success());

    let mut content = String::new();
    resp.read_to_string(&mut content);
    content
}

fn get_contest_list() -> Vec<String> {
    let mut contest_list = Vec::new();
    for i in 1..100 {
        let prev = contest_list.len();

        let url = format!("https://beta.atcoder.jp/contests/archive?lang=ja&page={}", i);
        let content = request_html_string(&url);

        let document = Document::from(content.as_str());
        let re = Regex::new(r"/contests/").unwrap();
        for node in document.find(Name("tr").descendant(Name("a"))) {
            let href = node.attr("href").unwrap();
            if re.is_match(href) {
                let contest_name = re.replace_all(href, "").to_string();
                contest_list.push(contest_name);
            }
        }

        if contest_list.len() == prev {
            break;
        }
    }
    contest_list
}

fn get_contest_info(contest_name: &str) -> ContestInfo {
    let url = format!("https://beta.atcoder.jp/contests/{}/standings/json", contest_name);
    let json_str = request_html_string(&url);
    serde_json::from_str(&json_str).unwrap()
}

#[derive(Serialize, Deserialize)]
struct ContestInfo {
    #[serde(rename = "Fixed")]
    fixed: bool,
    #[serde(rename = "TaskInfo")]
    tasks: Vec<TaskInfo>,
    #[serde(rename = "StandingsData")]
    standings: Vec<StandingsUser>,
}

#[derive(Serialize, Deserialize)]
struct TaskInfo {
    #[serde(rename = "Assignment")]
    assignment: String,
    #[serde(rename = "TaskName")]
    name: String,
    #[serde(rename = "TaskScreenName")]
    id: String,
}

#[derive(Serialize, Deserialize)]
struct StandingsUser {
    #[serde(rename = "Rank")]
    rank: usize,
    #[serde(rename = "UserScreenName")]
    name: String,
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn get_contest_list_test() {
        let contest_list = get_contest_list();
        assert!(contest_list.contains(&"jag2017summer-day1".to_string()));
        assert!(contest_list.contains(&"joi2006ho".to_string()));
    }

    #[test]
    fn get_problem_list_test() {
        let contest_info = get_contest_info("arc082");
        assert_eq!(contest_info.tasks.len(), 4);
        assert_eq!(contest_info.standings.len(), 1196);
    }
}