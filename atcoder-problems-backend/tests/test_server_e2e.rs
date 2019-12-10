use async_std::prelude::*;
use async_std::task;
use atcoder_problems_backend::server::run_server;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::*;
use diesel::{insert_into, ExpressionMethods, PgConnection, RunQueryDsl};

pub mod utils;

fn prepare_data_set(conn: &PgConnection) {
    insert_into(submission_count::table)
        .values(vec![
            (
                submission_count::user_id.eq("u1"),
                submission_count::count.eq(5),
            ),
            (
                submission_count::user_id.eq("u2"),
                submission_count::count.eq(5),
            ),
        ])
        .execute(conn)
        .unwrap();
    insert_into(accepted_count::table)
        .values(vec![(
            accepted_count::user_id.eq("u1"),
            accepted_count::problem_count.eq(1),
        )])
        .execute(conn)
        .unwrap();
    insert_into(rated_point_sum::table)
        .values(vec![(
            rated_point_sum::user_id.eq("u1"),
            rated_point_sum::point_sum.eq(1.0),
        )])
        .execute(conn)
        .unwrap();
    let submissions = vec![
        // for user=u1
        (0, "p1", "c1", "u1", "WA"),
        (1, "p1", "c1", "u1", "RE"),
        (2, "p1", "c1", "u1", "AC"),
        (3, "p1", "c1", "u1", "AC"),
        (100, "p1", "c1", "u1", "AC"),
        // for user=u2
        (4, "p1", "c1", "u2", "WA"),
        (5, "p1", "c1", "u2", "RE"),
        (6, "p1", "c1", "u2", "AC"),
        (7, "p1", "c1", "u2", "AC"),
        (200, "p1", "c1", "u2", "AC"),
    ]
    .into_iter()
    .map(
        |(epoch_second, problem_id, contest_id, user_id, result)| Submission {
            id: epoch_second,
            epoch_second,
            problem_id: problem_id.to_string(),
            contest_id: contest_id.to_string(),
            user_id: user_id.to_string(),
            result: result.to_string(),
            ..Default::default()
        },
    )
    .collect::<Vec<_>>();
    insert_into(submissions::table)
        .values(submissions)
        .execute(conn)
        .unwrap();
}

#[test]
fn run_test_server_e2e() {
    task::block_on(async {
        let conn = utils::connect_to_test_sql();
        prepare_data_set(&conn);

        let server = task::spawn(async {
            run_server(utils::SQL_URL, 8080).await.unwrap();
            Result::<(), surf::Exception>::Ok(())
        });

        let client = task::spawn(async {
            task::sleep(std::time::Duration::from_millis(100)).await;

            let submissions: Vec<Submission> =
                surf::get("http://localhost:8080/atcoder-api/results?user=u1")
                    .await?
                    .body_json()
                    .await?;
            assert_eq!(submissions.len(), 5);
            assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

            let mut response =
                surf::get("http://localhost:8080/atcoder-api/results?user=u2").await?;
            let etag = response.header("Etag").unwrap().to_string();
            let submissions: Vec<Submission> = response.body_json().await?;
            assert_eq!(submissions.len(), 5);
            assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

            let response = surf::get("http://localhost:8080/atcoder-api/results?user=u2")
                .set_header("If-None-Match", etag)
                .await?;
            assert_eq!(response.status(), 304);

            let submissions: Vec<Submission> =
                surf::get("http://localhost:8080/atcoder-api/v3/from/100")
                    .await?
                    .body_json()
                    .await?;
            assert_eq!(submissions.len(), 2);
            assert!(submissions.iter().all(|s| s.epoch_second >= 100));

            let response = surf::get("http://localhost:8080/atcoder-api/v3/from/").await?;
            assert_eq!(response.status(), 404);

            let response = surf::get("http://localhost:8080/atcoder-api/results").await?;
            assert_eq!(response.status(), 400);

            let response = surf::get("http://localhost:8080/healthcheck").await?;
            assert_eq!(response.status(), 200);

            let response = surf::get("http://localhost:8080/").await?;
            assert_eq!(response.status(), 404);

            assert_eq!(
                surf::get("http://localhost:8080/atcoder-api/v3/from/100")
                    .await?
                    .header("access-control-allow-origin")
                    .unwrap(),
                "*"
            );
            assert_eq!(
                surf::get("http://localhost:8080/atcoder-api/v2/user_info?user=u1")
                    .await?
                    .header("access-control-allow-origin")
                    .unwrap(),
                "*"
            );
            assert_eq!(
                surf::get("http://localhost:8080/atcoder-api/results?user=u1")
                    .await?
                    .header("access-control-allow-origin")
                    .unwrap(),
                "*"
            );

            Ok(())
        });
        server.race(client).await.unwrap();
    });
}
