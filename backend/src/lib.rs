#![feature(plugin, decl_macro)]
#![plugin(rocket_codegen)]
extern crate rocket;

extern crate reqwest;
extern crate select;
extern crate regex;
extern crate serde_json;
extern crate serde;
extern crate chrono;
extern crate toml;
extern crate rand;

#[macro_use]
extern crate mysql;

#[macro_use]
extern crate serde_derive;

pub mod scraper;
pub mod conf;
pub mod db;
pub mod api;

use rocket::Rocket;

pub fn create_rocket(connection: db::SqlConnection) -> Rocket {
    rocket::ignite().mount("/hello", routes![api::hello]).manage(connection)
}
