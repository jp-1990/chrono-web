use crate::{
    database::mongodb_database::MongoDatabase,
    models::activity_model::{Activity, ActivityData, PostActivityBody, PostActivityPayload},
};
use mongodb::{
    bson::{datetime::DateTime, oid::ObjectId},
    results::UpdateResult,
};
use rocket::{http::Status, serde::json::Json, State};

// mongo test
// https://medium.com/geekculture/build-a-rest-api-with-rust-and-mongodb-rocket-version-7ea90ebd9fe7

#[post("/activity", data = "<new_activity>")]
pub fn create_activity(
    db: &State<MongoDatabase>,
    new_activity: Json<PostActivityBody>,
) -> Result<(), Status> {
    let user_id = String::from("5f00b442bab42e04c05f5a9e");
    let data = PostActivityPayload {
        title: new_activity.title,
        variant: new_activity.variant.into(),
        group: new_activity.group,
        notes: new_activity.notes,
        start: new_activity.start,
        end: new_activity.end,
        timezone: new_activity.timezone,
        data: ActivityData { exercise: None },
    };

    println!("{:?}", data);

    Ok(())

    // let response = db.create_activity(data, user_id);
    // match response {
    //     Ok(res) => Ok(res),
    //     Err(_) => Err(Status::InternalServerError),
    // }
}

// #[patch("/activity/<path>", data = "<new_activity>")]
// pub fn update_activity(
//     db: &State<MongoDatabase>,
//     path: String,
//     new_activity: Json<UpdateActivityBody>,
// ) -> Result<Json<Activity>, Status> {
//     let id = path;
//     if id.is_empty() {
//         return Err(Status::BadRequest);
//     };
//
//     let start = new_activity.start.to_owned();
//     let end = new_activity.end.to_owned();
//
//     let mut data = UpdateActivity {
//         description: new_activity.description.to_owned(),
//         title: new_activity.title.to_owned(),
//         start: None,
//         end: None,
//         color: new_activity.color.to_owned(),
//         group: new_activity.group.to_owned(),
//     };
//     match start {
//         Some(val) => data.start = Some(DateTime::parse_rfc3339_str(val).unwrap()),
//         None => (),
//     };
//     match end {
//         Some(val) => data.end = Some(DateTime::parse_rfc3339_str(val).unwrap()),
//         None => (),
//     };
//
//     let response = db.update_activity(&id, &data);
//     match response {
//         Ok(update) if update.matched_count == 1 => {
//             let updated_activity = db.get_activity(&id);
//             match updated_activity {
//                 Ok(activity) => Ok(Json(activity)),
//                 Err(_) => Err(Status::InternalServerError),
//             }
//         }
//         Ok(_update) => Err(Status::NotFound),
//         Err(_) => Err(Status::InternalServerError),
//     }
// }
//
// #[delete("/activity/<path>")]
// pub fn delete_activity(db: &State<MongoDatabase>, path: String) -> Result<Json<&str>, Status> {
//     let id = path;
//     if id.is_empty() {
//         return Err(Status::BadRequest);
//     };
//     let response = db.delete_activity(&id);
//     match response {
//         Ok(delete) if delete.deleted_count == 1 => Ok(Json("Activity deleted")),
//         Ok(_delete) => Err(Status::NotFound),
//         Err(_) => Err(Status::InternalServerError),
//     }
// }
//
// #[get("/activity/<path>")]
// pub fn get_activity(db: &State<MongoDatabase>, path: String) -> Result<Json<Activity>, Status> {
//     let id = path;
//     if id.is_empty() {
//         return Err(Status::BadRequest);
//     };
//     let response = db.get_activity(&id);
//     match response {
//         Ok(activity) => Ok(Json(activity)),
//         Err(_) => Err(Status::InternalServerError),
//     }
// }
//
// #[get("/activities")]
// pub fn get_activities(db: &State<MongoDatabase>) -> Result<Json<Vec<Activity>>, Status> {
//     let response = db.get_all_activities();
//     match response {
//         Ok(activities) => Ok(Json(activities)),
//         Err(_) => Err(Status::InternalServerError),
//     }
// }
// ------------
