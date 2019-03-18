use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub postgresql_user: String,
    pub postgresql_pass: String,
    pub postgresql_host: String,
}

impl Config {
    pub fn create_from_file<P: AsRef<Path>>(path: P) -> Result<Config, Box<Error>> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let config = serde_json::from_reader(reader)?;
        Ok(config)
    }
}
