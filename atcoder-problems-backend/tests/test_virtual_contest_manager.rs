use atcoder_problems_backend::sql::internal::virtual_contest_manager::VirtualContestManager;
use diesel::connection::SimpleConnection;

pub mod utils;

#[test]
fn test_update_streak_ranking() {
    let conn = utils::connect_to_test_sql();
    conn.batch_execute(
        r"
        INSERT INTO internal_users (internal_user_id) VALUES ('user');
        INSERT INTO internal_virtual_contests (id, internal_user_id, start_epoch_second, duration_second)
        VALUES
        ('contest_1', 'user', 0, 100),
        ('contest_2', 'user', 50, 100);
        INSERT INTO internal_virtual_contest_items (problem_id, internal_virtual_contest_id)
        VALUES
        ('problem_1', 'contest_1'),
        ('problem_2', 'contest_2');
    ",
    )
    .unwrap();

    assert_eq!(
        conn.get_running_contest_problems(3).unwrap(),
        vec!["problem_1".to_owned()]
    );
    assert_eq!(
        conn.get_running_contest_problems(75).unwrap(),
        vec!["problem_1".to_owned(), "problem_2".to_owned()]
    );
    assert_eq!(
        conn.get_running_contest_problems(125).unwrap(),
        vec!["problem_2".to_owned()]
    );
}
