use algorithm_problem_client::AtCoderClient;
use atcoder_problems_backend::crawler;
use diesel::pg::PgConnection;
use diesel::Connection;
use log::{error, info};
use std::{env, thread, time};

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");
    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let args: Vec<_> = env::args().collect();
    let client = AtCoderClient::default();

    match args[1].as_str() {
        "contest" => {
            let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");
            crawler::crawl_contest_and_problems(&conn, &client).expect("Failed to crawl contests");
        }
        arg => {
            let handler = match arg {
                "new_contests" => crawler::crawl_from_new_contests,
                "new" => crawler::crawl_new_submissions,
                "all" => crawler::crawl_all_submissions,
                "recent_submitted" => crawler::crawl_from_recent_submitted,
                unsupported => unimplemented!("Unsupported: {}", unsupported),
            };

            loop {
                let conn = PgConnection::establish(&url);
                if let Err(e) = conn {
                    error!("{:?}", e);
                    thread::sleep(time::Duration::from_millis(1000));
                    continue;
                }
                let conn = conn.unwrap();
                if let Err(e) = handler(&conn, &client) {
                    error!("{:?}", e);
                    thread::sleep(time::Duration::from_millis(1000));
                    continue;
                }
            }
        }
    }
}
