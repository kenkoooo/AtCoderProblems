use crate::util::Problem;

pub struct AtCoderSubmissionListResponse {
    pub max_page: u32,
    pub submissions: Vec<AtCoderSubmission>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AtCoderContest {
    pub id: String,
    pub start_epoch_second: u64,
    pub duration_second: u64,
    pub title: String,
    pub rate_change: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AtCoderSubmission {
    pub id: u64,
    pub epoch_second: u64,
    pub problem_id: String,
    pub contest_id: String,
    pub user_id: String,
    pub language: String,
    pub point: f64,
    pub length: u64,
    pub result: String,
    pub execution_time: Option<u64>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AtCoderProblem {
    pub id: String,
    pub title: String,
    pub position: String,
    pub contest_id: String,
}

impl Problem for AtCoderProblem {
    fn url(&self) -> String {
        format!(
            "https://atcoder.jp/contests/{}/tasks/{}",
            self.contest_id, self.id
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_url() {
        let problem = AtCoderProblem {
            id: "arc102_c".to_string(),
            title: "".to_string(),
            position: "".to_string(),
            contest_id: "arc102".to_string(),
        };
        assert_eq!(
            "https://atcoder.jp/contests/arc102/tasks/arc102_c".to_string(),
            problem.url()
        );
    }
}
