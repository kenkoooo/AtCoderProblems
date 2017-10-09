use std::env;

extern crate atcoder_problems;

#[macro_use]
extern crate log;
extern crate log4rs;

use atcoder_problems::set_up_log;
use atcoder_problems::scraper::get_submissions;
use atcoder_problems::db::SqlConnection;
use std::collections::BTreeSet;
use std::time::Duration;
use std::thread;

fn main() {
    set_up_log();
    let args: Vec<String> = env::args().collect();
    assert!(args.len() >= 2);
    let conf = atcoder_problems::conf::load_toml(&args[1]);

    let sql = SqlConnection::new(&conf.mysql);

    loop {
        let contest = sql.poll_oldest_crawled_contest();
        info!("start crawling in {}", contest);

        let already_crawled_ids = sql.select_contest_submissions(&contest).into_iter().map(|s| s.id).collect::<BTreeSet<_>>();

        let mut already_crawled_count = 0;
        for page in 1..1000 {
            let submissions = get_submissions(&contest, page).into_iter().filter(|ref s| !already_crawled_ids.contains(&s.id)).collect::<Vec<_>>();
            sql.insert_submissions(&submissions);
            already_crawled_count += 20 - submissions.len();
            if already_crawled_count > 100 {
                break;
            }
            info!("contest={}, page={}, already_crawled={}", contest, page, already_crawled_count);
        }
        info!("finish crawling in {}", contest);
        sql.mark_as_crawled(&contest);
        thread::sleep(Duration::from_millis(500));
    }
}