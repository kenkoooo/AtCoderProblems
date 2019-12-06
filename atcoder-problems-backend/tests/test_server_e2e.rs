use actix_web::dev::{Service, ServiceResponse};
use actix_web::http::header::{ETAG, IF_NONE_MATCH};
use actix_web::{test, App};
use atcoder_problems_backend::server;
use atcoder_problems_backend::sql::models::Submission;
use atcoder_problems_backend::sql::schema::*;
use diesel::{insert_into, ExpressionMethods, PgConnection, RunQueryDsl};
use futures::executor::block_on;
use futures::StreamExt;

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

async fn take_body(response: &mut ServiceResponse) -> Vec<u8> {
    let mut body = response.take_body();
    let mut bytes = vec![];
    while let Some(item) = body.next().await {
        bytes.extend_from_slice(&item.unwrap());
    }
    bytes
}

#[test]
fn test_server_e2e() {
    let data = utils::connect_to_test_sql_pool();
    let conn = data.pool.get().unwrap();
    prepare_data_set(&conn);

    let mut app = block_on(test::init_service(
        App::new().configure(|cfg| server::config(cfg, data.clone())),
    ));
    let request = test::TestRequest::get()
        .uri("/atcoder-api/results?user=u1")
        .to_request();
    let submissions: Vec<Submission> = block_on(test::read_response_json(&mut app, request));
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u1"));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/results?user=u2")
        .to_request();
    let mut response: ServiceResponse = block_on(app.call(request)).unwrap();
    let body = block_on(take_body(&mut response));
    let submissions: Vec<Submission> = serde_json::from_slice(&body).unwrap();
    let etag = response.headers().get(ETAG).unwrap().to_str().unwrap();
    assert_eq!(submissions.len(), 5);
    assert!(submissions.iter().all(|s| s.user_id.as_str() == "u2"));

    let request = test::TestRequest::get()
        .header(IF_NONE_MATCH, etag)
        .uri("/atcoder-api/results?user=u2")
        .to_request();
    let response: ServiceResponse = block_on(app.call(request)).unwrap();
    assert_eq!(response.status(), 304);

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/from/100")
        .to_request();
    let submissions: Vec<Submission> = block_on(test::read_response_json(&mut app, request));
    assert_eq!(submissions.len(), 2);
    assert!(submissions.iter().all(|s| s.epoch_second >= 100));

    let request = test::TestRequest::get()
        .uri("/atcoder-api/v3/from/")
        .to_request();
    let response: ServiceResponse = block_on(app.call(request)).unwrap();
    assert!(response.status().is_client_error());

    let request = test::TestRequest::get()
        .uri("/atcoder-api/results")
        .to_request();
    let response: ServiceResponse = block_on(app.call(request)).unwrap();
    assert!(response.status().is_client_error());

    let request = test::TestRequest::get().uri("/healthcheck").to_request();
    let response: ServiceResponse = block_on(app.call(request)).unwrap();
    assert!(response.status().is_success());

    let request = test::TestRequest::get().uri("/").to_request();
    let response: ServiceResponse = block_on(app.call(request)).unwrap();
    assert!(response.status().is_client_error());
}
