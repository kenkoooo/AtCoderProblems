/// Represents a problem from AtCoder (matches the DB schema)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    /// The problem ID (e.g., "abc399_a")
    pub id: String,
    /// The contest ID (e.g., "abc399")
    pub contest_id: String,
    /// The problem index (e.g., "A", "B", "C")
    pub problem_index: String,
    /// The problem name (e.g., "Hamming Distance")
    pub name: String,
}

impl Problem {
    /// Returns the problem title (e.g., "A. Hamming Distance")
    pub fn title(&self) -> String {
        format!("{}. {}", self.problem_index, self.name)
    }
}

/// Represents a submission from AtCoder
#[derive(Debug, Clone, PartialEq)]
pub struct Submission {
    /// The submission ID
    pub id: i64,
    /// The submission date and time in epoch seconds
    pub epoch_second: i64,
    /// The problem the submission is for
    pub problem_id: String,
    /// The contest ID (e.g., "abc399")
    pub contest_id: String,
    /// The user who made the submission
    pub user: String,
    /// The programming language used
    pub language: String,
    /// The score obtained
    pub score: f64,
    /// The code length in bytes
    pub code_length: i32,
    /// The result of the submission (e.g., "AC", "WA", "TLE")
    pub result: String,
    /// The execution time in milliseconds (None if not available)
    pub execution_time: Option<i32>,
}
