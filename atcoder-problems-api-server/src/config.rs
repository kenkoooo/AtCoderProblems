use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use serde::Deserialize;

use crate::sql::{ConnectorTrait, SqlConnector};

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

pub trait ConfigTrait<C: ConnectorTrait> {
    fn get_conn(&self) -> Result<C, String>;
}

impl ConfigTrait<SqlConnector> for Config {
    fn get_conn(&self) -> Result<SqlConnector, String> {
        SqlConnector::new(
            &self.postgresql_user,
            &self.postgresql_pass,
            &self.postgresql_host,
        )
    }
}
