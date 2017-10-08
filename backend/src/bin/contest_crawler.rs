use std::env;

extern crate atcoder_problems;

use atcoder_problems::scraper::get_contest_list;
use atcoder_problems::db::SqlConnection;

fn main() {
    let contests = get_contest_list();

    let args: Vec<String> = env::args().collect();
    assert!(args.len() >= 2);
    let conf = atcoder_problems::conf::load_toml(&args[1]);
    let connection = SqlConnection::new(&conf.mysql);
    connection.insert_contests(&contests);
}