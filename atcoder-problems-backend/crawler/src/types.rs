/// Represents a problem from AtCoder
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    /// The problem prefix (e.g., "A", "B", "C")
    pub prefix: String,
    /// The problem name
    pub name: String,
    /// The URL to the problem
    pub url: String,
}

/// Represents a submission from AtCoder
#[derive(Debug, Clone, PartialEq, Eq)]
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
    pub score: String,
    /// The code length in bytes
    pub code_length: u32,
    /// The result of the submission (e.g., "AC", "WA", "TLE")
    pub result: String,
    /// The execution time in milliseconds
    pub execution_time: String,
    /// The URL of the submission
    pub url: String,
}
