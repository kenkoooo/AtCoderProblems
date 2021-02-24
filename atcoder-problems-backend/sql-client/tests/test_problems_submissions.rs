use sql_client::models::Submission;
use sql_client::problems_submissions::ProblemsSubmissionUpdater;
use sql_client::submission_client::SubmissionClient;
use sql_client::PgPool;
use sqlx::postgres::PgRow;
use sqlx::Row;

mod utils;

enum Table {
    First,
    Shortest,
    Fastest,
}

async fn get_from(pool: &PgPool, table: Table) -> Vec<(String, String, i64)> {
    let table = match table {
        Table::First => "first",
        Table::Shortest => "shortest",
        Table::Fastest => "fastest",
    };
    let query = format!(
        "SELECT contest_id, problem_id, submission_id FROM {}",
        table
    );

    sqlx::query(&query)
        .bind(table)
        .map(|row: PgRow| {
            let contest_id: String = row.get("contest_id");
            let problem_id: String = row.get("problem_id");
            let submission_id: i64 = row.get("submission_id");
            (contest_id, problem_id, submission_id)
        })
        .fetch_all(pool)
        .await
        .unwrap()
}

async fn setup_contests() -> PgPool {
    let pool = utils::initialize_and_connect_to_test_sql().await;
    sqlx::query(
        r"
        INSERT INTO contests (id, start_epoch_second, duration_second, title, rate_change) VALUES
        ('contest1', 1, 0, '', ''), ('contest2', 1, 0, '', '');
        ",
    )
    .execute(&pool)
    .await
    .unwrap();

    pool
}

#[async_std::test]
async fn test_problem_info_aggrefator() {
    let ignored_submission = vec![Submission {
        id: 0,
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        epoch_second: 0,
        length: 1,
        execution_time: Some(1),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let submissions1 = vec![Submission {
        id: 1,
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        epoch_second: 10,
        length: 20,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let submissions2 = vec![Submission {
        id: 2,
        problem_id: "problem1".to_owned(),
        contest_id: "contest2".to_owned(),
        epoch_second: 10,
        length: 10,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];

    {
        let pool = setup_contests().await;

        pool.update_submissions(&ignored_submission).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let first = get_from(&pool, Table::First).await;
        assert_eq!(first.len(), 0);

        pool.update_submissions(&submissions1).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let first = get_from(&pool, Table::First).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);

        pool.update_submissions(&submissions2).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let first = get_from(&pool, Table::First).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }

    {
        let pool = setup_contests().await;

        pool.update_submissions(&submissions2).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let first = get_from(&pool, Table::First).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions2[0].contest_id);
        assert_eq!(first[0].1, submissions2[0].problem_id);
        assert_eq!(first[0].2, submissions2[0].id);

        pool.update_submissions(&submissions1).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let first = get_from(&pool, Table::First).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }

    {
        let pool = setup_contests().await;

        pool.update_submissions(&submissions1).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let shortest = get_from(&pool, Table::Shortest).await;
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions1[0].contest_id);
        assert_eq!(shortest[0].1, submissions1[0].problem_id);
        assert_eq!(shortest[0].2, submissions1[0].id);

        pool.update_submissions(&submissions2).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let shortest = get_from(&pool, Table::Shortest).await;
        assert_eq!(shortest.len(), 1);
        assert_eq!(shortest[0].0, submissions2[0].contest_id);
        assert_eq!(shortest[0].1, submissions2[0].problem_id);
        assert_eq!(shortest[0].2, submissions2[0].id);
    }

    {
        let pool = setup_contests().await;

        pool.update_submissions(&submissions2).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let fastest = get_from(&pool, Table::Fastest).await;
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions2[0].contest_id);
        assert_eq!(fastest[0].1, submissions2[0].problem_id);
        assert_eq!(fastest[0].2, submissions2[0].id);

        pool.update_submissions(&submissions1).await.unwrap();
        pool.update_submissions_of_problems().await.unwrap();
        let fastest = get_from(&pool, Table::Fastest).await;
        assert_eq!(fastest.len(), 1);
        assert_eq!(fastest[0].0, submissions1[0].contest_id);
        assert_eq!(fastest[0].1, submissions1[0].problem_id);
        assert_eq!(fastest[0].2, submissions1[0].id);
    }
}
