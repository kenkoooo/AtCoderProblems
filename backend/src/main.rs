use std::env;

extern crate atcoder_problems;

fn main() {
    let args: Vec<String> = env::args().collect();
    assert!(args.len() >= 2);
    let conf = atcoder_problems::conf::load_toml(&args[1]);
    println!("{}", conf.mysql);
}