use std::env;
extern crate dotenv;
use dotenv::dotenv;

use crate::models::activity_model::{Activity, UpdateActivity};
use mongodb::{
    bson::{doc, extjson::de::Error, oid::ObjectId},
    results::{DeleteResult, InsertOneResult, UpdateResult},
    sync::{Client, Collection},
};

pub struct MongoDatabase {
    col: Collection<Activity>,
}

impl MongoDatabase {
    pub fn init() -> Self {
        dotenv().ok();

        let uri = match env::var("DATABASE") {
            Ok(v) => v.to_string(),
            Err(_) => format!("Error loading env variable"),
        };
        let client = Client::with_uri_str(uri).unwrap();
        let db = client.database("task-tracker-testing");
        let col: Collection<Activity> = db.collection("tasks");
        MongoDatabase { col }
    }

    pub fn create_activity(&self, new_activity: Activity) -> Result<InsertOneResult, Error> {
        let new_doc = Activity {
            id: None,
            title: new_activity.title,
            description: new_activity.description,
            created_at: new_activity.created_at,
            start: new_activity.start,
            end: new_activity.end,
            color: new_activity.color,
            group: new_activity.group,
            user: new_activity.user,
            v: 0,
        };

        let activity = self
            .col
            .insert_one(new_doc, None)
            .ok()
            .expect("Error creating user");
        Ok(activity)
    }

    pub fn update_activity(
        &self,
        id: &String,
        new_activity: &UpdateActivity,
    ) -> Result<UpdateResult, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};
        let mut update_fields = doc! {};

        if new_activity.title.is_some() {
            update_fields.insert("title", &new_activity.title);
        };

        if new_activity.description.is_some() {
            update_fields.insert("description", &new_activity.description);
        };

        if new_activity.group.is_some() {
            update_fields.insert("group", &new_activity.group);
        };

        if new_activity.start.is_some() {
            update_fields.insert("start", &new_activity.start);
        };

        if new_activity.end.is_some() {
            update_fields.insert("end", &new_activity.end);
        };

        if new_activity.color.is_some() {
            update_fields.insert("colour", &new_activity.color);
        };

        let new_doc = doc! {
            "$set": &update_fields
        };

        let activity = self
            .col
            .update_one(filter, new_doc, None)
            .ok()
            .expect("Error updating activity");
        Ok(activity)
    }

    pub fn delete_activity(&self, id: &String) -> Result<DeleteResult, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};

        let delete_result = self
            .col
            .delete_one(filter, None)
            .ok()
            .expect("Error deleting activity");
        Ok(delete_result)
    }

    pub fn get_activity(&self, id: &String) -> Result<Activity, Error> {
        let obj_id = ObjectId::parse_str(id).unwrap();
        let filter = doc! {"_id": obj_id};

        let activity_result = self
            .col
            .find_one(filter, None)
            .ok()
            .expect("Error getting activity");

        Ok(activity_result.unwrap())
    }

    pub fn get_all_activities(&self) -> Result<Vec<Activity>, Error> {
        let cursors = self
            .col
            .find(None, None)
            .ok()
            .expect("Error getting all activities");

        let activities = cursors.map(|doc| doc.unwrap()).collect();
        Ok(activities)
    }
}
