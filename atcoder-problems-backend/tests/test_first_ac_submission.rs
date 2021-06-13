use atcoder_problems_backend::updater::first_ac_submission::update_first_ac_of_problems;
use sql_client::models::Submission;
use sql_client::submission_client::SubmissionClient;
use sql_client::{PgPool, PgRow, Row};

mod utils;

async fn get_from(pool: &PgPool) -> Vec<(String, String, i64)> {
    let query = "SELECT contest_id, problem_id, submission_id FROM first";

    sql_client::query(&query)
        .bind("first")
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
    sql_client::query(
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
async fn test_first_ac_aggrefator() {
    let ignored_submissions = vec![
        // ignored since submit before contest started
        Submission {
            id: 0,
            user_id: "user1".to_owned(),
            problem_id: "problem1".to_owned(),
            contest_id: "contest1".to_owned(),
            epoch_second: 0,
            length: 1,
            execution_time: Some(1),
            result: "AC".to_owned(),
            ..Default::default()
        },
        // ignored since submitter is not a contestant
        Submission {
            id: 1,
            user_id: "not_contestant_user".to_owned(),
            problem_id: "problem1".to_owned(),
            contest_id: "contest1".to_owned(),
            epoch_second: 10,
            length: 1,
            execution_time: Some(1),
            result: "AC".to_owned(),
            ..Default::default()
        },
    ];
    let submissions1 = vec![Submission {
        id: 3,
        user_id: "user1".to_owned(),
        problem_id: "problem1".to_owned(),
        contest_id: "contest1".to_owned(),
        epoch_second: 10,
        length: 20,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let submissions2 = vec![Submission {
        id: 4,
        user_id: "user2".to_owned(),
        problem_id: "problem1".to_owned(),
        contest_id: "contest2".to_owned(),
        epoch_second: 10,
        length: 10,
        execution_time: Some(10),
        result: "AC".to_owned(),
        ..Default::default()
    }];
    let standings_dir = Some("tests/resources".to_owned());

    {
        let pool = setup_contests().await;
        let mut all_accepted_submissions = vec![];

        pool.update_submissions(&ignored_submissions).await.unwrap();
        all_accepted_submissions.append(&mut ignored_submissions.clone());
        update_first_ac_of_problems(&pool, &all_accepted_submissions, &standings_dir)
            .await
            .unwrap();
        let first = get_from(&pool).await;
        assert_eq!(first.len(), 0);

        pool.update_submissions(&submissions1).await.unwrap();
        all_accepted_submissions.append(&mut submissions1.clone());
        update_first_ac_of_problems(&pool, &all_accepted_submissions, &standings_dir)
            .await
            .unwrap();
        let first = get_from(&pool).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);

        pool.update_submissions(&submissions2).await.unwrap();
        all_accepted_submissions.append(&mut submissions2.clone());
        update_first_ac_of_problems(&pool, &all_accepted_submissions, &standings_dir)
            .await
            .unwrap();
        let first = get_from(&pool).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }

    {
        let pool = setup_contests().await;
        let mut all_accepted_submissions = vec![];

        pool.update_submissions(&submissions2).await.unwrap();
        all_accepted_submissions.append(&mut submissions2.clone());
        update_first_ac_of_problems(&pool, &all_accepted_submissions, &standings_dir)
            .await
            .unwrap();
        let first = get_from(&pool).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions2[0].contest_id);
        assert_eq!(first[0].1, submissions2[0].problem_id);
        assert_eq!(first[0].2, submissions2[0].id);

        pool.update_submissions(&submissions1).await.unwrap();
        all_accepted_submissions.append(&mut submissions1.clone());
        update_first_ac_of_problems(&pool, &all_accepted_submissions, &standings_dir)
            .await
            .unwrap();
        let first = get_from(&pool).await;
        assert_eq!(first.len(), 1);
        assert_eq!(first[0].0, submissions1[0].contest_id);
        assert_eq!(first[0].1, submissions1[0].problem_id);
        assert_eq!(first[0].2, submissions1[0].id);
    }
}
