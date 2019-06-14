use diesel::pg::PgConnection;
use diesel::Connection;
use log::info;
use std::env;

fn main() {
    simple_logger::init_with_level(log::Level::Info).unwrap();
    info!("Started");

    let url = env::var("SQL_URL").expect("SQL_URL must be set.");
    let conn = PgConnection::establish(&url).expect("Failed to connect PostgreSQL.");

    let args: Vec<_> = env::args().collect();
    match args[0].as_str() {
        "naive" => {}
        "new" => {}
        "all" => {}
        _ => {
            unimplemented!("Unsupported: {}", args[0]);
        }
    }
}
