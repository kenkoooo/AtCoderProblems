use chrono::{DateTime, Datelike, FixedOffset, TimeZone};

pub(crate) trait AsJst {
    fn as_jst(&self) -> DateTime<FixedOffset>;
    fn is_same_day_in_jst<T: TimeZone>(&self, rhs: &DateTime<T>) -> bool {
        let d1 = self.as_jst();
        let d2 = rhs.as_jst();
        d1.day() == d2.day() && d1.month() == d2.month() && d1.year() == d2.year()
    }
}

impl<Tz: TimeZone> AsJst for DateTime<Tz> {
    fn as_jst(&self) -> DateTime<FixedOffset> {
        self.with_timezone(&FixedOffset::east(9 * 3600))
    }
}