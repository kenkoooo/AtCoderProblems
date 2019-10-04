use atcoder_problems_backend::sql::{StreakUpdater, SubmissionClient, SubmissionRequest};
use diesel::connection::SimpleConnection;

pub mod utils;

#[test]
fn test_update_streak_ranking() {
    let conn = utils::connect_to_test_sql();
    conn.batch_execute(
        r"
    INSERT INTO submissions (id, epoch_second, problem_id, contest_id, user_id, language, point, length, result) VALUES 
    (1, 1570114800, 'problem_a', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T00:00:00+09:00
    (2, 1570150800, 'problem_b', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T10:00:00+09:00
    (3, 1570186800, 'problem_c', '', 'user1', '', 0, 0, 'AC'), -- 2019-10-04T20:00:00+09:00
    (4, 1570201200, 'problem_d', '', 'user1', '', 0, 0, 'AC'); -- 2019-10-05T00:00:00+09:00
    ",
    )
    .unwrap();
    let submissions = conn
        .get_submissions(SubmissionRequest::AllAccepted)
        .unwrap();
    conn.update_streak_count(&submissions).unwrap();
    let streak = conn.load_streak("user1").unwrap();
    assert_eq!(streak, 2);
}
