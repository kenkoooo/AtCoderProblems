use std::env;

extern crate atcoder_problems;

use atcoder_problems::scraper::get_submissions;
use atcoder_problems::db::SqlConnection;

fn main() {
    let args: Vec<String> = env::args().collect();
    assert!(args.len() >= 2);
    let conf = atcoder_problems::conf::load_toml(&args[1]);

    let sql = SqlConnection::new(&conf.mysql);
    let contest = sql.poll_oldest_crawled_contest();
    let submissions = get_submissions(&contest, 1);
    sql.insert_submissions(&submissions);
}