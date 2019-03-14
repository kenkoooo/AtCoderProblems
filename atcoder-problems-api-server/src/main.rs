use postgres::{Connection, TlsMode};

use serde::Deserialize;

use std::env;
use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

#[derive(Deserialize, Debug)]
struct Config {
    postgresql_user: String,
    postgresql_pass: String,
    postgresql_host: String,
}

fn read_user_from_file<P: AsRef<Path>>(path: P) -> Result<Config, Box<Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let config = serde_json::from_reader(reader)?;
    Ok(config)
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = read_user_from_file(&args[1]).unwrap();

    let conn = Connection::connect(
        format!(
            "postgresql://{}:{}@{}/atcoder",
            config.postgresql_user, config.postgresql_pass, config.postgresql_host
        ),
        TlsMode::None,
    );
    match conn {
        Ok(_) => {}
        Err(e) => {
            println!("{:#?}", e);
        }
    }
}
