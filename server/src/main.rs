use database::mongodb_database::MongoDatabase;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::serde::json::Json;
use rocket::{Request, Response};
use serde::Serialize;

mod api;
mod database;
mod models;
mod utils;

#[macro_use]
extern crate rocket;

use api::activity_api::{
    create_activity, delete_activity, get_activities, get_activity, update_activity,
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
fn rocket() -> _ {
    let db = MongoDatabase::init();
    rocket::build().manage(db).attach(CORS).mount(
        "/",
        routes![
            index,
            get_activity,
            get_activities,
            create_activity,
            update_activity,
            delete_activity
        ],
    )
}
