use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use serde::Deserialize;

pub trait ConfigTrait {
    fn get_user(&self) -> &str;
    fn get_pass(&self) -> &str;
    fn get_host(&self) -> &str;
}

#[derive(Deserialize, Debug, Clone)]
pub struct Config {
    postgresql_user: String,
    postgresql_pass: String,
    postgresql_host: String,
}
impl Config {
    pub fn create_from_file<P: AsRef<Path>>(path: P) -> Result<Config, Box<Error>> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let config = serde_json::from_reader(reader)?;
        Ok(config)
    }
}

impl ConfigTrait for Config {
    fn get_user(&self) -> &str {
        &self.postgresql_user
    }
    fn get_pass(&self) -> &str {
        &self.postgresql_pass
    }
    fn get_host(&self) -> &str {
        &self.postgresql_host
    }
}
