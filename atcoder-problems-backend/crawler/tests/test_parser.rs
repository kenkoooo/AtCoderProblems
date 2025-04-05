use crawler::{parse_submissions_html, parse_tasks_html};

#[test]
fn test_parse_tasks_html() {
    // Load the test HTML file
    let html_content = include_str!("assets/tasks.html");

    // Parse the HTML content
    let problems = parse_tasks_html(html_content).expect("Failed to parse tasks HTML");

    // Verify that we found the expected number of problems
    assert_eq!(
        problems.len(),
        7,
        "Expected 7 problems, found {}",
        problems.len()
    );

    // Verify the first problem
    let first_problem = &problems[0];
    assert_eq!(first_problem.prefix, "A");
    assert_eq!(first_problem.name, "Hamming Distance");
    assert_eq!(first_problem.url, "/contests/abc399/tasks/abc399_a");

    // Verify the last problem
    let last_problem = &problems[6];
    assert_eq!(last_problem.prefix, "G");
    assert_eq!(last_problem.name, "Colorful Spanning Tree");
    assert_eq!(last_problem.url, "/contests/abc399/tasks/abc399_g");

    // Verify all problems have the expected format
    for problem in &problems {
        assert!(
            !problem.prefix.is_empty(),
            "Problem prefix should not be empty"
        );
        assert!(!problem.name.is_empty(), "Problem name should not be empty");
        assert!(!problem.url.is_empty(), "Problem URL should not be empty");
        assert!(
            problem.url.starts_with("/contests/"),
            "Problem URL should start with /contests/"
        );
    }
}

#[test]
fn test_parse_submissions_html() {
    // Load the test HTML file
    let html_content = include_str!("assets/submissions.html");

    // Parse the HTML content
    let submissions =
        parse_submissions_html(html_content).expect("Failed to parse submissions HTML");

    // Verify that we found the expected number of submissions
    assert_eq!(
        submissions.len(),
        20,
        "Expected 20 submissions, found {}",
        submissions.len()
    );

    // Verify the first submission
    let first_submission = &submissions[0];
    assert_eq!(first_submission.id, "64188418");
    assert_eq!(first_submission.date, "2025-03-25 23:32:36+0900");
    assert_eq!(first_submission.problem, "G - Colorful Spanning Tree");
    assert_eq!(first_submission.user, "sounansya");
    assert_eq!(first_submission.language, "C++ 23 (gcc 12.2)");
    assert_eq!(first_submission.score, "675");
    assert_eq!(first_submission.code_length, 4211);
    assert_eq!(first_submission.result, "AC");
    assert_eq!(first_submission.execution_time, "3086 ms");
    assert_eq!(first_submission.memory_usage, "605208 KB");
    assert_eq!(
        first_submission.url,
        "/contests/abc399/submissions/64188418"
    );

    // Verify the last submission
    let last_submission = &submissions[19];
    assert_eq!(last_submission.id, "64269896");
    assert_eq!(last_submission.date, "2025-03-29 17:48:33+0900");
    assert_eq!(last_submission.problem, "F - Range Power Sum");
    assert_eq!(last_submission.user, "sounansya");
    assert_eq!(last_submission.language, "C++ 23 (gcc 12.2)");
    assert_eq!(last_submission.score, "550");
    assert_eq!(last_submission.code_length, 805);
    assert_eq!(last_submission.result, "AC");
    assert_eq!(last_submission.execution_time, "23 ms");
    assert_eq!(last_submission.memory_usage, "13376 KB");
    assert_eq!(last_submission.url, "/contests/abc399/submissions/64269896");

    // Verify all submissions have the expected format
    for submission in &submissions {
        assert!(
            !submission.id.is_empty(),
            "Submission ID should not be empty"
        );
        assert!(
            !submission.date.is_empty(),
            "Submission date should not be empty"
        );
        assert!(
            !submission.problem.is_empty(),
            "Submission problem should not be empty"
        );
        assert!(
            !submission.user.is_empty(),
            "Submission user should not be empty"
        );
        assert!(
            !submission.language.is_empty(),
            "Submission language should not be empty"
        );
        assert!(
            !submission.score.is_empty(),
            "Submission score should not be empty"
        );
        assert!(
            submission.code_length > 0,
            "Submission code length should be positive"
        );
        assert!(
            !submission.result.is_empty(),
            "Submission result should not be empty"
        );
        assert!(
            !submission.execution_time.is_empty(),
            "Submission execution time should not be empty"
        );
        assert!(
            !submission.memory_usage.is_empty(),
            "Submission memory usage should not be empty"
        );
        assert!(
            !submission.url.is_empty(),
            "Submission URL should not be empty"
        );
        assert!(
            submission.url.starts_with("/contests/"),
            "Submission URL should start with /contests/"
        );
    }
}
