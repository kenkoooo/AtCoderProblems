use std::env;

extern crate atcoder_problems;

use atcoder_problems::{create_rocket, db};

fn main() {
    let args: Vec<String> = env::args().collect();
    assert!(args.len() >= 2);
    let conf = atcoder_problems::conf::load_toml(&args[1]);

    let connection = db::SqlConnection::new(&conf.mysql);
    create_rocket(connection).launch();
}


