pub mod api;
pub mod config;
pub mod sql;

use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct Submission {
    id: i64,
    epoch_second: i64,
    problem_id: String,
    contest_id: String,
    user_id: String,
    language: String,
    point: f64,
    length: i32,
    result: String,
    execution_time: Option<i32>,
}

#[derive(Serialize, Debug)]
pub struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: usize,
    rated_point_sum: f64,
    rated_point_sum_rank: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::http;
    use actix_web::test::TestServer;
    use sql::ConnectorTrait;

    #[derive(Clone)]
    struct TestConnector {}
    impl ConnectorTrait for TestConnector {
        fn get_submissions(&self, user_id: &str) -> Result<Vec<Submission>, String> {
            unimplemented!()
        }
        fn get_user_info(&self, user_id: &str) -> Result<UserInfo, String> {
            unimplemented!()
        }
    }

    #[test]
    fn name() {
        let conn = TestConnector {};
        let mut srv = TestServer::build_with_state(move || conn.clone()).start(|app| {
            app.resource("/results", |r| {
                r.method(http::Method::GET).with(api::result_api);
            })
            .resource("/v2/user_info", |r| {
                r.method(http::Method::GET).with(api::user_info_api);
            });
        });

        let req = srv.client(http::Method::GET, "/results").finish().unwrap();
        let response = srv.execute(req.send()).unwrap();
        assert!(response.status().is_success());
    }
}
