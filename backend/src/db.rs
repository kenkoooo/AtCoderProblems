use mysql::Pool;

fn connect(uri: &str) -> Pool {
    Pool::new(uri).unwrap()
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn connect_test() {
        let pool = connect("mysql://root:@localhost:3306");
    }
}

