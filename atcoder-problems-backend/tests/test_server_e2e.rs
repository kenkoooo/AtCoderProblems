use actix_web::dev::Service;
use actix_web::{test, web, App};
use atcoder_problems_backend::server;

pub mod utils;

#[test]
fn test_server_e2e() {
    let data = utils::connect_to_test_sql_pool();
    let mut app = test::block_on(test::init_service(
        App::new().configure(|cfg| server::config(cfg, data.clone())),
    ));
    let request = test::TestRequest::get()
        .uri("/atcoder-api/results?user=1")
        .to_request();
    let response = test::block_on(app.call(request)).unwrap();
    unimplemented!("{:?}", response);
}
