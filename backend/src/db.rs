use mysql::Pool;

fn connect(uri: &str) -> Pool {
    match Pool::new(uri) {
        Err(_) => panic!("the connection to MySQL cannot be established."),
        Ok(p) => p
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn connect_test() {
        let pool = connect("mysql://root:@localhost:3306/test");
    }
}

