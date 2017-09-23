use regex::Regex;
use reqwest;
use select::document::Document;
use select::predicate::{Predicate, Attr, Class, Name};
use std::io::Read;
use serde_json;
use serde_json::{Value, Error};
use chrono::{DateTime, FixedOffset, ParseResult, Utc};

static URL_PREFIX: &str = "https://beta.atcoder.jp";

fn request_html_string(url: &str) -> String {
    let mut resp = reqwest::get(url).unwrap();
    assert!(resp.status().is_success());

    let mut content = String::new();
    resp.read_to_string(&mut content);
    content
}

/// Returns a contest ID list
fn get_contest_list() -> Vec<String> {
    let mut contest_list = Vec::new();
    let mut page = 1;
    loop {
        let prev = contest_list.len();

        let url = format!("{}/contests/archive?lang=ja&page={}", URL_PREFIX, page);
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
        page += 1;
    }
    contest_list
}

fn get_contest_info(contest_name: &str) -> ContestInfo {
    let url = format!("{}/contests/{}/standings/json", URL_PREFIX, contest_name);
    let json_str = request_html_string(&url);
    serde_json::from_str(&json_str).unwrap()
}


fn convert_timestamp(time_string: &str) -> Option<i64> {
    let re = Regex::new(r"^(\d{4}\-\d{2}\-\d{2}) (\d{2}:\d{2}:\d{2}\+\d{2})(\d{2})$").unwrap();
    if re.is_match(time_string) {
        let x = DateTime::parse_from_rfc3339(&(re.replace_all(time_string, "$1") + re.replace_all(time_string, "T$2:$3")));
        x.map(|t| t.timestamp()).ok()
    } else {
        None
    }
}

/// Returns start and end time of the given contest as unix-time seconds
fn get_contest_time(contest_name: &str) -> (i64, i64) {
    let url = format!("{}/contests/{}", URL_PREFIX, contest_name);
    let content = request_html_string(&url);

    let document = Document::from(content.as_str());


    let mut v = Vec::new();
    for node in document.find(Class("contest-duration").descendant(Name("time"))) {
        let t = node.text();
        convert_timestamp(&t).map(|i| v.push(i));
    }

    if v[0] < v[1] {
        (v[0], v[1])
    } else {
        (v[1], v[0])
    }
}

fn get_submissions(contest_name: &str, page: usize) -> Vec<Submission> {
    let url = format!("{}/contests/{}/submissions?page={}", URL_PREFIX, contest_name, page);
    let content = request_html_string(&url);
    let document = Document::from(content.as_str());

    let problem_prefix = format!("/contests/{}/tasks/", contest_name);
    let submission_prefix = format!("/contests/{}/submissions/", contest_name);
    document.find(Name("tbody").descendant(Name("tr"))).map(|node| {
        let mut tds = node.find(Name("td"));
        let time = convert_timestamp(&tds.next().unwrap().text()).unwrap();
        tds.next();
        tds.next();
        let language = tds.next().unwrap().text();
        let point = tds.next().unwrap().text().parse::<i64>().unwrap();
        let code_length = tds.next().unwrap().text().replace(" Byte", "").parse::<usize>().unwrap();
        let result = tds.next().unwrap().text();
        let execution_time = tds.next().map(|n| n.text().replace(" ms", "").parse::<usize>().unwrap());

        let mut links = node.find(Name("a"));
        let problem = links.next().unwrap().attr("href").unwrap().replace(&problem_prefix, "");
        let user = links.next().unwrap().text();
        links.next();
        let id = links.next().unwrap().attr("href").unwrap().replace(&submission_prefix, "").parse::<usize>().unwrap();

        Submission { id, time, user, language, point, code_length, result, execution_time }
    }).collect::<Vec<Submission>>()
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

struct Submission {
    id: usize,
    time: i64,
    user: String,
    language: String,
    point: i64,
    code_length: usize,
    result: String,
    execution_time: Option<usize>,
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn get_contest_list_test() {
        let contest_list = get_contest_list();
        assert!(contest_list.contains(&"jag2017summer-day1".to_string()));
        assert!(contest_list.contains(&"joi2006ho".to_string()));
        assert!(contest_list.len() >= 382);
    }

    #[test]
    fn get_contest_info_test() {
        let contest_info = get_contest_info("arc082");
        assert_eq!(contest_info.tasks.len(), 4);
        assert_eq!(contest_info.standings.len(), 1196);
    }

    #[test]
    fn get_contest_time_test() {
        assert_eq!((1504353600, 1504359600), get_contest_time("arc082"));
    }

    #[test]
    fn get_submissions_test() {
        let submissions = get_submissions("arc082", 1);
        assert_eq!(submissions.len(), 20);
    }
}