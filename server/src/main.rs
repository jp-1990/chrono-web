use database::mongodb_database::MongoDatabase;
use dotenv::dotenv;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::serde::json::Json;
use rocket::{Request, Response};
use serde::Serialize;
use std::env;
extern crate dotenv;

mod api;
mod database;
mod models;
mod utils;

#[macro_use]
extern crate rocket;

use api::activity_api::{
    create_activity, // delete_activity, get_activities, get_activity, update_activity,
};

#[derive(Serialize)]
struct Test {
    text: &'static str,
}

#[get("/")]
fn index() -> Json<Test> {
    let test = Test {
        text: "hello, world!",
    };
    Json(test)
}

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }
    // TODO: scope headers?
    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, PATCH, PUT, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));

        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "POST, PATCH, GET, DELETE",
            ));
            response.set_header(Header::new(
                "Access-Control-Allow-Headers",
                "content-type, authorization",
            ));
        }
    }
}

#[launch]
async fn rocket() -> _ {
    dotenv().ok();

    let uri = match env::var("CLUSTER") {
        Ok(v) => v,
        Err(_) => String::from("Error loading env variable"),
    };
    let db_name = "task-tracker-testing";

    let db = match MongoDatabase::init(&uri, db_name).await {
        Ok(v) => v,
        Err(_) => panic!("database connection failed to initialize"),
    };

    rocket::build().manage(db).attach(CORS).mount(
        "/api/v1/",
        routes![
            index,
            // get_activity,
            // get_activities,
            create_activity,
            // update_activity,
            // delete_activity
        ],
    )
}
