use db::SqlConnection;
use rocket::State;

#[get("/<name>/<age>")]
pub fn hello(name: String, age: u8, connection: State<SqlConnection>) -> String {
    format!("Hello, {} year old named {}!", age, name)
}
