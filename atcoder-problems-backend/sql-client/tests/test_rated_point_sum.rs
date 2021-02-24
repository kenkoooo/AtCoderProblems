use sql_client::models::{Contest, ContestProblem, Submission, UserSum};
use sql_client::rated_point_sum::RatedPointSumClient;
use sql_client::PgPool;
use sqlx::postgres::PgRow;
use sqlx::Row;

mod utils;

const FIRST_AGC_EPOCH_SECOND: i64 = 1_468_670_400;
const UNRATED_STATE: &str = "-";
const USER_ID: &str = "user";
const RATED_CONTEST: &str = "rated_contest";
const UNRATED_CONTEST1: &str = "unrated_contest1";
const UNRATED_CONTEST2: &str = "unrated_contest2";

const SAME_CONTEST_UNRATED: &str = "same_contest_unrated";
const SAME_CONTEST_RATED: &str = "same_contest_rated";

async fn setup_contests(pool: &PgPool) {
    let contests = vec![
        Contest {
            id: RATED_CONTEST.to_string(),
            start_epoch_second: FIRST_AGC_EPOCH_SECOND,
            duration_second: 1000,
            title: "Rated Contest".to_string(),
            rate_change: "All".to_string(),
        },
        Contest {
            id: UNRATED_CONTEST1.to_string(),
            start_epoch_second: 0,
            duration_second: 1000,
            title: "Unrated Old Contest".to_string(),
            rate_change: "All".to_string(),
        },
        Contest {
            id: UNRATED_CONTEST2.to_string(),
            start_epoch_second: FIRST_AGC_EPOCH_SECOND,
            duration_second: 1000,
            title: "Unrated New Contest".to_string(),
            rate_change: UNRATED_STATE.to_string(),
        },
        Contest {
            id: SAME_CONTEST_RATED.to_string(),
            start_epoch_second: FIRST_AGC_EPOCH_SECOND,
            duration_second: 1000,
            title: "Unrated New Contest".to_string(),
            rate_change: "All".to_string(),
        },
        Contest {
            id: SAME_CONTEST_UNRATED.to_string(),
            start_epoch_second: FIRST_AGC_EPOCH_SECOND,
            duration_second: 1000,
            title: "Unrated New Contest".to_string(),
            rate_change: UNRATED_STATE.to_string(),
        },
    ];
    for contest in contests {
        sqlx::query(
            r"
            INSERT INTO contests
            (id, start_epoch_second, duration_second, title, rate_change)
            VALUES ($1, $2, $3, $4, $5)
            ",
        )
        .bind(contest.id)
        .bind(contest.start_epoch_second)
        .bind(contest.duration_second)
        .bind(contest.title)
        .bind(contest.rate_change)
        .execute(pool)
        .await
        .unwrap();
    }
}

async fn setup_contest_problems(pool: &PgPool) {
    let problems = vec![
        ContestProblem {
            problem_id: "problem1".to_string(),
            contest_id: RATED_CONTEST.to_string(),
        },
        ContestProblem {
            problem_id: "problem2".to_string(),
            contest_id: UNRATED_CONTEST1.to_string(),
        },
        ContestProblem {
            problem_id: "problem3".to_string(),
            contest_id: UNRATED_CONTEST1.to_string(),
        },
        ContestProblem {
            problem_id: "problem4".to_string(),
            contest_id: RATED_CONTEST.to_string(),
        },
        ContestProblem {
            problem_id: "problem5".to_string(),
            contest_id: SAME_CONTEST_RATED.to_string(),
        },
        ContestProblem {
            problem_id: "problem5".to_string(),
            contest_id: SAME_CONTEST_UNRATED.to_string(),
        },
    ];

    for problem in problems {
        sqlx::query(
            r"
            INSERT INTO contest_problem (problem_id, contest_id)
            VALUES ($1, $2)
            ",
        )
        .bind(problem.problem_id)
        .bind(problem.contest_id)
        .execute(pool)
        .await
        .unwrap();
    }
}

#[async_std::test]
async fn test_update_rated_point_sum() {
    let pool = utils::initialize_and_connect_to_test_sql().await;

    setup_contests(&pool).await;
    setup_contest_problems(&pool).await;

    let submissions = vec![
        Submission {
            id: 0,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem1".to_string(),
            contest_id: RATED_CONTEST.to_string(),
            ..Default::default()
        },
        Submission {
            id: 1,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem1".to_string(),
            contest_id: RATED_CONTEST.to_string(),
            ..Default::default()
        },
        Submission {
            id: 2,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem2".to_string(),
            contest_id: UNRATED_CONTEST1.to_string(),
            ..Default::default()
        },
        Submission {
            id: 3,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem3".to_string(),
            contest_id: UNRATED_CONTEST2.to_string(),
            ..Default::default()
        },
        Submission {
            id: 4,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem4".to_string(),
            contest_id: RATED_CONTEST.to_string(),
            ..Default::default()
        },
        Submission {
            id: 5,
            user_id: USER_ID.to_string(),
            point: 100.0,
            problem_id: "problem5".to_string(),
            contest_id: SAME_CONTEST_UNRATED.to_string(),
            ..Default::default()
        },
    ];

    pool.update_rated_point_sum(&submissions).await.unwrap();
    let sums = sqlx::query("SELECT user_id, point_sum FROM rated_point_sum")
        .map(|row: PgRow| {
            let user_id: String = row.get("user_id");
            let point_sum: f64 = row.get("point_sum");
            UserSum { user_id, point_sum }
        })
        .fetch_all(&pool)
        .await
        .unwrap();
    assert_eq!(sums.len(), 1);
    assert_eq!(sums[0].user_id, USER_ID.to_string());
    assert_eq!(sums[0].point_sum, 300.0);
    assert_eq!(
        pool.get_users_rated_point_sum(USER_ID).await.unwrap(),
        300.0
    );
    assert_eq!(pool.get_rated_point_sum_rank(300.0).await.unwrap(), 0);

    assert!(pool
        .get_users_rated_point_sum("non_existing_user")
        .await
        .is_none());
}

