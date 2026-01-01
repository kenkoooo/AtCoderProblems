use crawler::{
    parse_contests_archive_html, parse_permanent_contests_html, parse_submissions_html,
    parse_tasks_html,
};

#[test]
fn test_parse_tasks_html() {
    // Load the test HTML file
    let html_content = include_str!("assets/tasks.html");

    // Parse the HTML content
    let problems = parse_tasks_html(html_content, "abc399").expect("Failed to parse tasks HTML");

    // Verify that we found the expected number of problems
    assert_eq!(
        problems.len(),
        7,
        "Expected 7 problems, found {}",
        problems.len()
    );

    // Verify the first problem
    let first_problem = &problems[0];
    assert_eq!(first_problem.id, "abc399_a");
    assert_eq!(first_problem.contest_id, "abc399");
    assert_eq!(first_problem.problem_index, "A");
    assert_eq!(first_problem.name, "Hamming Distance");
    assert_eq!(first_problem.title(), "A. Hamming Distance");

    // Verify the last problem
    let last_problem = &problems[6];
    assert_eq!(last_problem.id, "abc399_g");
    assert_eq!(last_problem.contest_id, "abc399");
    assert_eq!(last_problem.problem_index, "G");
    assert_eq!(last_problem.name, "Colorful Spanning Tree");
    assert_eq!(last_problem.title(), "G. Colorful Spanning Tree");

    // Verify all problems have the expected format
    for problem in &problems {
        assert!(!problem.id.is_empty(), "Problem ID should not be empty");
        assert!(
            !problem.contest_id.is_empty(),
            "Problem contest_id should not be empty"
        );
        assert!(
            !problem.problem_index.is_empty(),
            "Problem index should not be empty"
        );
        assert!(!problem.name.is_empty(), "Problem name should not be empty");
        assert!(
            !problem.title().is_empty(),
            "Problem title should not be empty"
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
    assert_eq!(first_submission.id, 65165333);
    assert_eq!(first_submission.epoch_second, 1745489734);
    assert_eq!(first_submission.problem_id, "tenka1_2012_9");
    assert_eq!(first_submission.contest_id, "tenka1-2012-qualC");
    assert_eq!(first_submission.user, "Sky_Thunder");
    assert_eq!(first_submission.language, "Python (CPython 3.11.4)");
    assert_eq!(first_submission.score, 0.);
    assert_eq!(first_submission.code_length, 265);
    assert_eq!(first_submission.result, "RE");
    assert_eq!(first_submission.execution_time, Some(13));

    let screenamed_submission = &submissions[17];
    assert_eq!(screenamed_submission.user, "The_Bouningeeeen");

    // Verify the last submission
    let last_submission = &submissions[19];
    assert_eq!(last_submission.id, 64467929);
    assert_eq!(last_submission.epoch_second, 1743719670);
    assert_eq!(last_submission.problem_id, "tenka1_2012_9");
    assert_eq!(last_submission.contest_id, "tenka1-2012-qualC");
    assert_eq!(last_submission.user, "yamate11");
    assert_eq!(last_submission.language, "C++ 20 (gcc 12.2)");
    assert_eq!(last_submission.score, 100.);
    assert_eq!(last_submission.code_length, 21215);
    assert_eq!(last_submission.result, "AC");
    assert_eq!(last_submission.execution_time, Some(17));

    // Verify all submissions have the expected format
    for submission in &submissions {
        assert!(submission.id > 0, "Submission ID should be positive");
        assert!(
            submission.epoch_second > 0,
            "Submission epoch second should be positive"
        );
        assert!(
            !submission.problem_id.is_empty(),
            "Submission problem should not be empty"
        );
        assert!(
            !submission.contest_id.is_empty(),
            "Submission contest ID should not be empty"
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
            submission.code_length > 0,
            "Submission code length should be positive"
        );
        assert!(
            !submission.result.is_empty(),
            "Submission result should not be empty"
        );
        assert!(
            submission.execution_time.is_some(),
            "Submission execution time should be Some"
        );
    }
}

#[test]
fn test_parse_tasks_html_abc308() {
    // Load the test HTML file
    let html_content = include_str!("assets/tasks_abc308.html");

    // Parse the HTML content
    let problems = parse_tasks_html(html_content, "abc308").expect("Failed to parse tasks HTML");

    // Verify that we found the expected number of problems
    assert_eq!(
        problems.len(),
        8,
        "Expected 8 problems, found {}",
        problems.len()
    );

    // Verify the first problem
    let first_problem = &problems[0];
    assert_eq!(first_problem.id, "abc308_a");
    assert_eq!(first_problem.contest_id, "abc308");
    assert_eq!(first_problem.problem_index, "A");
    assert_eq!(first_problem.name, "New Scheme");
    assert_eq!(first_problem.title(), "A. New Scheme");

    // Verify the last problem (Ex)
    let last_problem = &problems[7];
    assert_eq!(last_problem.id, "abc308_h");
    assert_eq!(last_problem.contest_id, "abc308");
    assert_eq!(last_problem.problem_index, "Ex");
    assert_eq!(last_problem.name, "Make Q");
    assert_eq!(last_problem.title(), "Ex. Make Q");
}

#[test]
fn test_parse_tasks_html_codequeen2023() {
    // Load the test HTML file
    let html_content = include_str!("assets/tasks_codequeen2023.html");

    // Parse the HTML content
    let problems = parse_tasks_html(html_content, "codequeen2023-final-open")
        .expect("Failed to parse tasks HTML");

    // Verify that we found the expected number of problems
    assert_eq!(
        problems.len(),
        6,
        "Expected 6 problems, found {}",
        problems.len()
    );

    // Verify the first problem
    let first_problem = &problems[0];
    assert_eq!(first_problem.id, "codequeen2023_final_a");
    assert_eq!(first_problem.contest_id, "codequeen2023-final-open");
    assert_eq!(first_problem.problem_index, "A");
    assert_eq!(first_problem.name, "QUEN");
    assert_eq!(first_problem.title(), "A. QUEN");

    // Verify a middle problem
    let middle_problem = &problems[1];
    assert_eq!(middle_problem.id, "codequeen2023_final_b");
    assert_eq!(middle_problem.contest_id, "codequeen2023-final-open");
    assert_eq!(middle_problem.problem_index, "B");
    assert_eq!(middle_problem.name, "N-Queens Problem");
    assert_eq!(middle_problem.title(), "B. N-Queens Problem");

    // Verify the last problem
    let last_problem = &problems[5];
    assert_eq!(last_problem.id, "codequeen2023_final_f");
    assert_eq!(last_problem.contest_id, "codequeen2023-final-open");
    assert_eq!(last_problem.problem_index, "F");
    // Note: HTML entities like &#39; are decoded to apostrophe
    assert!(
        last_problem.name.contains("Queen"),
        "Last problem name should contain 'Queen'"
    );
}

#[test]
fn test_parse_contests_archive_html() {
    // Load the test HTML file
    let html_content = include_str!("assets/contests_archive.html");

    // Parse the HTML content
    let contests =
        parse_contests_archive_html(html_content).expect("Failed to parse contests archive HTML");

    // Verify that we found the expected number of contests
    assert_eq!(
        contests.len(),
        3,
        "Expected 3 contests, found {}",
        contests.len()
    );

    // Verify the first contest
    let first_contest = &contests[0];
    assert_eq!(first_contest.id, "kupc2019");
    assert_eq!(first_contest.start_epoch_second, 1570939200);
    assert_eq!(first_contest.duration_second, 5 * 3600);
    assert_eq!(first_contest.title, "Kyoto University Programming Contest 2019");
    assert_eq!(first_contest.rate_change, "-");

    // Verify the second contest
    let second_contest = &contests[1];
    assert_eq!(second_contest.id, "agc039");
    assert_eq!(second_contest.start_epoch_second, 1570276800);
    assert_eq!(second_contest.duration_second, 2 * 3600 + 30 * 60);
    assert_eq!(second_contest.title, "AtCoder Grand Contest 039");
    assert_eq!(second_contest.rate_change, "All");

    // Verify the third contest
    let third_contest = &contests[2];
    assert_eq!(third_contest.id, "abc142");
    assert_eq!(third_contest.start_epoch_second, 1569672000);
    assert_eq!(third_contest.duration_second, 1 * 3600 + 40 * 60);
    assert_eq!(third_contest.title, "AtCoder Beginner Contest 142");
    assert_eq!(third_contest.rate_change, "~ 1999");
}

#[test]
fn test_parse_permanent_contests_html() {
    // Load the test HTML file
    let html_content = include_str!("assets/contests_permanent.html");

    // Parse the HTML content
    let contests =
        parse_permanent_contests_html(html_content).expect("Failed to parse permanent contests HTML");

    // Verify that we found the expected number of contests
    assert_eq!(
        contests.len(),
        4,
        "Expected 4 contests, found {}",
        contests.len()
    );

    // Verify the first contest
    let first_contest = &contests[0];
    assert_eq!(first_contest.id, "practice");
    assert_eq!(first_contest.start_epoch_second, 0);
    assert_eq!(first_contest.duration_second, 100 * 365 * 24 * 3600);
    assert_eq!(first_contest.title, "practice contest");
    assert_eq!(first_contest.rate_change, "-");

    // Verify the second contest
    let second_contest = &contests[1];
    assert_eq!(second_contest.id, "APG4b");
    assert!(second_contest.title.contains("APG4b"));

    // Verify the third contest
    let third_contest = &contests[2];
    assert_eq!(third_contest.id, "abs");
    assert_eq!(third_contest.title, "AtCoder Beginners Selection");

    // Verify the fourth contest
    let fourth_contest = &contests[3];
    assert_eq!(fourth_contest.id, "practice2");
    assert_eq!(fourth_contest.title, "AtCoder Library Practice Contest");
}

#[test]
fn test_parse_contests_archive_html_empty_page() {
    // Test with an empty page (no tbody)
    let html_content = r#"
        <!DOCTYPE html>
        <html>
        <head><title>Past Contests - AtCoder</title></head>
        <body>
        <div id="main-container">
            <div class="panel panel-default">
                <p>No contests found.</p>
            </div>
        </div>
        </body>
        </html>
    "#;

    let contests =
        parse_contests_archive_html(html_content).expect("Should handle empty page gracefully");

    assert_eq!(contests.len(), 0, "Expected 0 contests for empty page");
}
