use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::results::{DeleteResult, InsertOneResult};
use mongodb::{error::Error, Client, Collection};
use rocket::fairing::Result;

use crate::models::activity_model::{
    Activity, GetActivityPayload, PostActivityPayload, StrengthExercise,
};

pub struct MongoDatabase {
    activities: Collection<Activity>,
}

impl MongoDatabase {
    pub async fn init(uri: &str, db_name: &str) -> Result<MongoDatabase, Error> {
        // Create a new client and connect to the server
        let client = Client::with_uri_str(uri).await?;
        let db = client.database(db_name);
        let activities: Collection<Activity> = db.collection("activities");

        Ok::<MongoDatabase, Error>(MongoDatabase { activities })
    }

    pub async fn create_activity(
        &self,
        new_activity: PostActivityPayload<'_>,
        user_id: String,
    ) -> Result<InsertOneResult, Error> {
        let activity = Activity::new(
            new_activity.variant,
            new_activity.title.to_string(),
            new_activity.group.unwrap_or("").into(),
            new_activity.notes.unwrap_or("").into(),
            new_activity.start.into(),
            new_activity.end.into(),
            new_activity.timezone,
            new_activity.data,
            user_id,
        );

        let res = self.activities.insert_one(activity).await?;
        Ok(res)

        // let result = self
        //     .user_month_year
        //     .update_one(
        //         doc! { "_id": doc_id, "__v": 0 },
        //         doc! {
        //             "$inc": {
        //                 "total": 1,
        //                 "mins": activity.mins,
        //                 format!("summary.{}.total", activity.title): 1,
        //                 format!("summary.{}.mins", activity.title): activity.mins,
        //             },
        //             "$set": {
        //                 format!("day.{:?}.{}", day, activity.id): to_bson(&activity).unwrap(),
        //             }
        //         },
        //         Some(
        //             mongodb::options::UpdateOptions::builder()
        //                 .upsert(true)
        //                 .build(),
        //         ),
        //     )
        //     .expect("Failed to update document");
        // Ok((result, activity_id.to_string()))
    }

    // pub fn update_activity(
    //     &self,
    //     id: &String,
    //     new_activity: &UpdateActivity,
    // ) -> Result<UpdateResult, Error> {
    //     let obj_id = ObjectId::parse_str(id).unwrap();
    //     let filter = doc! {"_id": obj_id};
    //     let mut update_fields = doc! {};
    //
    //     if new_activity.title.is_some() {
    //         update_fields.insert("title", &new_activity.title);
    //     };
    //
    //     if new_activity.description.is_some() {
    //         update_fields.insert("description", &new_activity.description);
    //     };
    //
    //     if new_activity.group.is_some() {
    //         update_fields.insert("group", &new_activity.group);
    //     };
    //
    //     if new_activity.start.is_some() {
    //         update_fields.insert("start", &new_activity.start);
    //     };
    //
    //     if new_activity.end.is_some() {
    //         update_fields.insert("end", &new_activity.end);
    //     };
    //
    //     if new_activity.color.is_some() {
    //         update_fields.insert("colour", &new_activity.color);
    //     };
    //
    //     let new_doc = doc! {
    //         "$set": &update_fields
    //     };
    //
    //     let activity = self
    //         .activities
    //         .update_one(filter, new_doc, None)
    //         .ok()
    //         .expect("Error updating activity");
    //     Ok(activity)
    // }

    pub async fn delete_activity_by_id(
        &self,
        id: String,
        user_id: String,
    ) -> Result<DeleteResult, Error> {
        let filter = doc! {
            "_id": ObjectId::parse_str(id).expect("failed to parse string to ObjectId"),
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId")
        };

        let res = self.activities.delete_one(filter).await?;
        Ok(res)
    }

    pub async fn get_activity_by_id(
        &self,
        id: String,
        user_id: String,
    ) -> Result<Option<Activity>, Error> {
        let filter = doc! {
            "_id": ObjectId::parse_str(id).expect("failed to parse string to ObjectId"),
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId")
        };

        let res = self.activities.find_one(filter).await?;
        Ok(res)
    }

    // pub fn get_all_activities(&self) -> Result<Vec<Activity>, Error> {
    //     let cursors = self
    //         .activities
    //         .find(None, None)
    //         .ok()
    //         .expect("Error getting all activities");
    //
    //     let activities = cursors.map(|doc| doc.unwrap()).collect();
    //     Ok(activities)
    // }
}

#[cfg(test)]
mod tests {
    use crate::models::activity_model::{
        ActivityData, CardioExercise, Exercise, MobilityExercise, Set,
    };

    use super::*;
    use core::panic;
    use dotenv::dotenv;
    use mongodb::bson::datetime::DateTime;
    use mongodb::bson::Bson;
    use std::env;
    extern crate dotenv;

    async fn init_db() -> MongoDatabase {
        dotenv().ok();

        let uri = match env::var("CLUSTER") {
            Ok(v) => v.to_string(),
            Err(_) => format!("Error loading env variable"),
        };

        let db_name = "task-tracker-testing";

        let db = match MongoDatabase::init(&uri, db_name).await {
            Ok(v) => v,
            Err(_) => panic!("database connection failed to initialize"),
        };
        db
    }

    #[tokio::test]
    async fn create() {
        let db = init_db().await;

        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let data = PostActivityPayload {
            title: "test create",
            variant: "exercise".into(),
            group: Some("test group"),
            notes: Some("insert 1"),
            start: DateTime::parse_rfc3339_str("2000-01-01T09:00:00.000Z").unwrap(),
            end: DateTime::parse_rfc3339_str("2000-01-01T09:30:00.000Z").unwrap(),
            timezone: 0,
            data: ActivityData {
                exercise: Some(vec![
                    Exercise::Strength(StrengthExercise::new(
                        "pressups".to_string(),
                        vec![Set {
                            idx: 0,
                            reps: Some(30),
                            rest: Some(60),
                            weight: None,
                            duration: None,
                        }],
                    )),
                    Exercise::Mobility(MobilityExercise::new(
                        "pressups2".to_string(),
                        vec![Set {
                            idx: 0,
                            reps: None,
                            rest: Some(60),
                            weight: None,
                            duration: Some(30),
                        }],
                    )),
                    Exercise::Cardio(CardioExercise::new("running".to_string(), 30, 5000)),
                ]),
            },
        };

        let res = db.create_activity(data, user_id).await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn get_one() {
        let db = init_db().await;

        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let data = PostActivityPayload {
            title: "test get",
            variant: "default".into(),
            group: Some("test group"),
            notes: Some("insert 2"),
            start: DateTime::parse_rfc3339_str("2000-01-01T09:00:00.000Z").unwrap(),
            end: DateTime::parse_rfc3339_str("2000-01-01T09:30:00.000Z").unwrap(),
            timezone: 0,
            data: ActivityData { exercise: None },
        };

        let res = db.create_activity(data, user_id.clone()).await;
        assert!(res.is_ok());

        let new_id = res.unwrap().inserted_id;
        let new_id = match new_id {
            Bson::ObjectId(oid) => oid,
            _ => panic!("failed to retrieve objectid"),
        };

        let inserted_activity = db
            .get_activity_by_id(new_id.to_hex(), user_id.clone())
            .await;
        assert!(inserted_activity.is_ok());
        assert!(inserted_activity.unwrap().is_some());
    }

    #[tokio::test]
    async fn delete_one() {
        let db = init_db().await;

        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let data = PostActivityPayload {
            title: "test get",
            variant: "default".into(),
            group: Some("test group"),
            notes: Some("insert 2"),
            start: DateTime::parse_rfc3339_str("2000-01-01T09:00:00.000Z").unwrap(),
            end: DateTime::parse_rfc3339_str("2000-01-01T09:30:00.000Z").unwrap(),
            timezone: 0,
            data: ActivityData { exercise: None },
        };

        let res = db.create_activity(data, user_id.clone()).await;
        assert!(res.is_ok());

        let new_id = res.unwrap().inserted_id;
        let new_id = match new_id {
            Bson::ObjectId(oid) => oid,
            _ => panic!("failed to retrieve objectid"),
        };

        let inserted_activity = db
            .delete_activity_by_id(new_id.to_hex(), user_id.clone())
            .await;
        assert!(inserted_activity.is_ok());
        assert!(inserted_activity.unwrap().deleted_count == 1);
    }
}
