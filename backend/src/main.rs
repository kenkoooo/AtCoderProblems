use std::env;

extern crate atcoder_problems;

use atcoder_problems::{create_rocket, db};


fn main() {
//    let args: Vec<String> = env::args().collect();
//    assert!(args.len() >= 2);
//    let conf = atcoder_problems::conf::load_toml(&args[1]);
//    println!("{}", conf.mysql);
    let connection = db::SqlConnection::new("mysql://root:@localhost:3306/test");
    create_rocket(connection).launch();
}


