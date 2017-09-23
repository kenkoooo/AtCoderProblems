use regex::Regex;
use reqwest;
use select::document::Document;
use select::predicate::{Predicate, Attr, Class, Name};
use std::io::Read;

fn get_request(url: &str) -> String {
    let mut resp = reqwest::get(url).unwrap();
    assert!(resp.status().is_success());

    let mut content = String::new();
    resp.read_to_string(&mut content);
    content
}

fn get_contest_list() -> Vec<String> {
    let url = format!("https://beta.atcoder.jp/contests/archive?lang=ja&page={}", 1);
    let content = get_request(&url);
    let mut contest_list = Vec::new();

    let document = Document::from(content.as_str());
    let re = Regex::new(r"/contests/").unwrap();
    for node in document.find(Name("tr").descendant(Name("a"))) {
        let href = node.attr("href").unwrap();
        if re.is_match(href) {
            let contest_name = re.replace_all(href, "").to_string();
            contest_list.push(contest_name);
        }
    }
    contest_list
}


#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn atcoder() {
        let contest_list = get_contest_list();
        assert!(contest_list.contains(&"jag2017summer-day1".to_string()));
    }
}