pub trait ToAnyhowError<T> {
    fn map_anyhow(self) -> anyhow::Result<T>;
}

impl<T> ToAnyhowError<T> for std::result::Result<T, tide::Error> {
    fn map_anyhow(self) -> anyhow::Result<T> {
        self.map_err(anyhow::Error::msg)
    }
}

pub trait ToTideError<T> {
    fn map_tide_err(self) -> tide::Result<T>;
}

impl<T> ToTideError<T> for anyhow::Result<T> {
    fn map_tide_err(self) -> tide::Result<T> {
        self.map_err(|e| tide::Error::from_str(tide::StatusCode::InternalServerError, e))
    }
}
