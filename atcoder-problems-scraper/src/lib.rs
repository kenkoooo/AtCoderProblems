pub mod scraper;

#[derive(Debug)]
pub struct Contest {
    id: String,
    start_epoch_second: i64,
    duration_second: i64,
    title: String,
    rate_change: String,
}

#[derive(Debug)]
pub struct Problem {
    id: String,
    contest_id: String,
    title: String,
}

pub struct Submission {
    id: u64,
    epoch_second: u64,
    problem_id: String,
    contest_id: String,
    user_id: String,
    language: String,
    point: Option<f64>,
    length: i32,
    result: String,
    execution_time: Option<i32>,
}
