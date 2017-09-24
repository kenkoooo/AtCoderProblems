use std::error::Error;
use std::fs::File;
use std::io::prelude::*;
use std::path::Path;
use toml;

pub fn load_toml(filepath: &str) -> Configure {
    let path = Path::new(filepath);
    let display = path.display();

    let mut file = match File::open(&path) {
        Err(why) => panic!("couldn't open {}: {}", display,
                           Error::description(&why)),
        Ok(file) => file,
    };
    let mut s = String::new();
    match file.read_to_string(&mut s) {
        Err(why) => panic!("couldn't read {}: {}", display,
                           Error::description(&why)),
        Ok(_) => {
            let value: Configure = toml::from_str(&s).unwrap();
            value
        }
    }
}

#[derive(Deserialize)]
pub struct Configure {
    pub mysql: String,
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn load_toml_test() {
        let configure = load_toml("env-test/test.toml");
        assert_eq!(configure.mysql, "mysql-url");
    }
}