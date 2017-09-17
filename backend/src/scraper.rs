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

fn get_contest_list() {
    let url = format!("https://beta.atcoder.jp/contests/archive?lang=ja&page={}", 1);
    let content = get_request(&url);
    println!("{}", content);

    let document = Document::from(content.as_str());
    for node in document.find(Name("tr").descendant(Name("a"))) {
        println!("{}", node.attr("href").unwrap());
    }
}


#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn atcoder() {
        get_contest_list();
    }
}