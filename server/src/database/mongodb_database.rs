use futures::TryStreamExt;
use mongodb::{
    bson::{doc, oid::ObjectId, Bson, Document},
    error::Error,
    Client, Collection,
};

use crate::{
    models::activity_model::{
        Activity, ActivityDelete, DeleteActivityPayload, GetActivitiesPayload, GetActivityPayload,
        PatchActivityPayload, PostActivityPayload,
    },
    utils::utils::insert_optional,
};

#[derive(Clone, Debug)]
pub struct MongoDatabase {
    activities: Collection<Activity>,
}

impl MongoDatabase {
    pub async fn init(uri: &str, db_name: &str) -> Result<MongoDatabase, Error> {
        // Create a new client and connect to the server
        let client = Client::with_uri_str(uri).await?;
        let db = client.database(db_name);
        let activities: Collection<Activity> = db.collection("activities");

        Ok::<Self, Error>(Self { activities })
    }

    async fn get_doc(&self, id: ObjectId, user_id: String) -> Result<Option<Activity>, Error> {
        let filter = doc! {
            "_id": id,
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId")
        };

        let res = self.activities.find_one(filter).await?;

        Ok(res)
    }

    pub async fn create_activity(
        &self,
        payload: PostActivityPayload,
        user_id: String,
    ) -> Result<Option<Activity>, Error> {
        let activity = Activity::new(
            payload.variant,
            payload.title.to_string(),
            payload.group.unwrap_or(String::from("")).into(),
            payload.notes.unwrap_or(String::from("")).into(),
            payload.start,
            payload.end,
            payload.timezone,
            payload.data,
            user_id.clone(),
        );

        let new_id = match self.activities.insert_one(activity).await {
            Ok(res) => match res.inserted_id {
                Bson::ObjectId(oid) => oid,
                _ => panic!("failed to retrieve objectid"),
            },
            Err(e) => return Err(e),
        };

        self.get_doc(new_id, user_id).await
    }

    pub async fn update_activity_by_id(
        &self,
        payload: PatchActivityPayload,
        user_id: String,
    ) -> Result<Option<Activity>, Error> {
        let filter = doc! {
            "_id": ObjectId::parse_str(payload.id.clone()).expect("failed to parse string to ObjectId"),
            "user": ObjectId::parse_str(user_id.clone()).expect("failed to parse string to ObjectId")
        };

        let mut update_doc = Document::new();

        if let Some(start) = payload.start {
            let start = mongodb::bson::DateTime::parse_rfc3339_str(start).unwrap();
            update_doc.insert("start", start);
        };

        if let Some(end) = payload.end {
            let end = mongodb::bson::DateTime::parse_rfc3339_str(end).unwrap();
            update_doc.insert("end", end);
        };

        insert_optional(&mut update_doc, "variant", payload.variant);
        insert_optional(&mut update_doc, "title", payload.title);
        insert_optional(&mut update_doc, "group", payload.group);
        insert_optional(&mut update_doc, "notes", payload.notes);
        insert_optional(&mut update_doc, "timezone", payload.timezone);

        if let Some(data) = payload.data {
            if let Some(exercise) = data.exercise {
                insert_optional(&mut update_doc, "data.exercise", Some(exercise));
            }
        }

        if !update_doc.is_empty() {
            let update = doc! { "$set": update_doc };
            Some(self.activities.update_one(filter, update).await)
        } else {
            None
        };

        self.get_doc(ObjectId::parse_str(payload.id).unwrap(), user_id)
            .await
    }

    pub async fn delete_activity_by_id(
        &self,
        payload: DeleteActivityPayload,
        user_id: String,
    ) -> Result<ActivityDelete, Error> {
        let filter = doc! {
            "_id": ObjectId::parse_str(payload.id.clone()).expect("failed to parse string to ObjectId"),
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId")
        };

        self.activities.delete_one(filter).await?;
        let deleted_activity = ActivityDelete {
            id: ObjectId::parse_str(payload.id).unwrap(),
        };

        Ok(deleted_activity)
    }

    pub async fn get_activity_by_id(
        &self,
        payload: GetActivityPayload,
        user_id: String,
    ) -> Result<Option<Activity>, Error> {
        let filter = doc! {
            "_id": ObjectId::parse_str(payload.id).expect("failed to parse string to ObjectId"),
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId")
        };

        let res = self.activities.find_one(filter).await?;
        Ok(res)
    }

    pub async fn get_activities(
        &self,
        payload: GetActivitiesPayload,
        user_id: String,
    ) -> Result<Vec<Activity>, Error> {
        let mut filter = doc! {
            "user": ObjectId::parse_str(user_id).expect("failed to parse string to ObjectId"),
        };
        insert_optional(&mut filter, "title", payload.title);
        insert_optional(&mut filter, "group", payload.group);
        insert_optional(&mut filter, "variant", payload.variant);

        if let Some(start) = payload.start {
            let start = mongodb::bson::DateTime::parse_rfc3339_str(start).unwrap();
            filter.insert("start", doc! { "$gte": start });
        };

        if let Some(end) = payload.end {
            let end = mongodb::bson::DateTime::parse_rfc3339_str(end).unwrap();
            filter.insert("end", doc! { "$lte": end });
        };

        let cursor = self.activities.find(filter).await?;
        let res = cursor.try_collect().await.unwrap_or_else(|_| vec![]);
        Ok(res)
    }
}

#[cfg(test)]
mod tests {
    use crate::models::activity_model::{
        ActivityData, ActivityVariant, CardioExercise, Exercise, MobilityExercise, Set,
        StrengthExercise,
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

    async fn create_test_activity(db: &MongoDatabase) -> (ObjectId, String) {
        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let payload = PostActivityPayload {
            title: "test get".to_string(),
            variant: "default".into(),
            group: Some("test group".to_string()),
            notes: Some("insert 2".to_string()),
            start: "2000-01-01T09:00:00.000Z".to_string(),
            end: "2000-01-01T09:30:00.000Z".to_string(),
            timezone: 0,
            data: None,
        };

        let activity = Activity::new(
            payload.variant,
            payload.title.to_string(),
            payload.group.unwrap_or(String::from("")).into(),
            payload.notes.unwrap_or(String::from("")).into(),
            payload.start,
            payload.end,
            payload.timezone,
            payload.data,
            user_id.clone(),
        );

        let new_id = match db.activities.insert_one(activity).await {
            Ok(res) => match res.inserted_id {
                Bson::ObjectId(oid) => oid,
                _ => panic!("failed to retrieve objectid"),
            },
            Err(_) => panic!("failed to create activity"),
        };

        (new_id, user_id.clone())
    }

    async fn delete_test_activity(db: &MongoDatabase, id: String, user_id: String) {
        let payload = DeleteActivityPayload { id };
        let _ = db.delete_activity_by_id(payload, user_id).await;
    }

    #[tokio::test]
    async fn create_one() {
        let db = init_db().await;

        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let data = PostActivityPayload {
            title: "test create".to_string(),
            variant: "exercise".into(),
            group: Some("test group".to_string()),
            notes: Some("insert 1".to_string()),
            start: "2000-01-01T09:00:00.000Z".to_string(),
            end: "2000-01-01T09:30:00.000Z".to_string(),
            timezone: 0,
            data: Some(ActivityData {
                exercise: Some(vec![
                    Exercise::Strength(StrengthExercise {
                        title: "pressups".to_string(),
                        sets: vec![Set {
                            idx: 0,
                            reps: Some(30),
                            rest: Some(60),
                            weight: None,
                            duration: None,
                        }],
                    }),
                    Exercise::Mobility(MobilityExercise {
                        title: "pressups2".to_string(),
                        sets: vec![Set {
                            idx: 0,
                            reps: None,
                            rest: Some(60),
                            weight: None,
                            duration: Some(30),
                        }],
                    }),
                    Exercise::Cardio(CardioExercise {
                        title: "running".to_string(),
                        duration: 30,
                        distance: 5000,
                    }),
                ]),
            }),
        };

        let inserted_activity = db.create_activity(data, user_id.clone()).await;
        assert!(inserted_activity.is_ok());

        let new_id = inserted_activity.unwrap().unwrap().id;
        delete_test_activity(&db, new_id.to_hex(), user_id).await;
    }

    #[tokio::test]
    async fn get_one() {
        let db = init_db().await;
        let (new_id, user_id) = create_test_activity(&db).await;

        let payload = GetActivityPayload {
            id: new_id.to_hex(),
        };

        let activity = db.get_activity_by_id(payload, user_id.clone()).await;
        assert!(activity.is_ok());
        assert!(activity.unwrap().is_some());

        delete_test_activity(&db, new_id.to_hex(), user_id).await;
    }

    #[tokio::test]
    async fn get_many() {
        let db = init_db().await;

        let user_id = String::from("5f00b442bab42e04c05f5a9e");
        let dates: Vec<(String, String)> = vec![
            (
                "2000-01-01T09:00:00.000Z".to_string(),
                "2000-01-01T09:30:00.000Z".to_string(),
            ),
            (
                "2000-01-02T09:00:00.000Z".to_string(),
                "2000-01-02T09:30:00.000Z".to_string(),
            ),
            (
                "2000-01-03T09:00:00.000Z".to_string(),
                "2000-01-03T09:30:00.000Z".to_string(),
            ),
            (
                "2000-01-04T09:00:00.000Z".to_string(),
                "2000-01-04T09:30:00.000Z".to_string(),
            ),
            (
                "2000-01-05T09:00:00.000Z".to_string(),
                "2000-01-05T09:30:00.000Z".to_string(),
            ),
        ];

        let results_futures = dates.iter().map(|x| {
            let data = PostActivityPayload {
                title: "get many".to_string(),
                variant: "default".into(),
                group: None,
                notes: None,
                start: x.0.clone(),
                end: x.1.clone(),
                timezone: 0,
                data: None,
            };
            db.create_activity(data, user_id.clone())
        });

        let mut inserted_ids = vec![];
        for res in results_futures {
            let id = match res.await {
                Ok(v) => v.unwrap().id,
                _ => panic!("failed to create activity"),
            };

            inserted_ids.push(id);
        }

        let filters = GetActivitiesPayload {
            variant: None,
            title: Some("get many".to_string()),
            group: None,
            start: Some("2000-01-01T00:00:00.000Z".to_string()),
            end: Some("2000-01-01T23:59:59.999Z".to_string()),
        };

        let activities = match db.get_activities(filters, user_id.clone()).await {
            Ok(v) => v,
            Err(_) => vec![],
        };

        assert!(activities.len() == 1);

        let filters = GetActivitiesPayload {
            variant: None,
            title: Some("get many".to_string()),
            group: None,
            start: Some("2000-01-01T00:00:00.000Z".to_string()),
            end: Some("2000-01-03T23:59:59.999Z".to_string()),
        };

        let activities = match db.get_activities(filters, user_id.clone()).await {
            Ok(v) => v,
            Err(_) => vec![],
        };

        assert!(activities.len() == 3);

        let filters = GetActivitiesPayload {
            variant: None,
            title: Some("get many".to_string()),
            group: None,
            start: None,
            end: None,
        };

        let activities = match db.get_activities(filters, user_id.clone()).await {
            Ok(v) => v,
            Err(_) => vec![],
        };

        assert!(activities.len() == 5);

        for id in inserted_ids {
            delete_test_activity(&db, id.to_hex(), user_id.clone()).await;
        }
    }

    #[tokio::test]
    async fn update_one() {
        let db = init_db().await;
        let (new_id, user_id) = create_test_activity(&db).await;

        let update_payload = PatchActivityPayload {
            id: new_id.to_hex(),
            title: Some("test update".to_string()),
            variant: Some(ActivityVariant::Default),
            group: Some("update group".to_string()),
            notes: Some("update 2".to_string()),
            start: None,
            end: Some("2000-01-01T10:30:00.000Z".to_string()),
            timezone: Some(0),
            data: None,
        };

        let updated_activity = db
            .update_activity_by_id(update_payload, user_id.clone())
            .await;
        assert!(updated_activity.is_ok());

        let payload = GetActivityPayload {
            id: new_id.to_hex(),
        };

        let activity = match db.get_activity_by_id(payload, user_id.clone()).await {
            Ok(v) => match v {
                Some(v) => v,
                None => panic!("failed to get actvitiy"),
            },
            Err(_) => panic!("failed to get actvitiy"),
        };

        assert!(activity.title == "test update");
        assert!(activity.variant == ActivityVariant::Default);
        assert!(activity.group == "update group");
        assert!(activity.notes == "update 2");
        assert!(activity.start == DateTime::parse_rfc3339_str("2000-01-01T09:00:00.000Z").unwrap());
        assert!(activity.end == DateTime::parse_rfc3339_str("2000-01-01T10:30:00.000Z").unwrap());

        let update_payload = PatchActivityPayload {
            id: new_id.to_hex(),
            title: None,
            variant: None,
            group: None,
            notes: None,
            start: None,
            end: None,
            timezone: None,
            data: Some(ActivityData {
                exercise: Some(vec![]),
            }),
        };

        let updated_activity = db
            .update_activity_by_id(update_payload, user_id.clone())
            .await;
        assert!(updated_activity.is_ok());

        let payload = GetActivityPayload {
            id: new_id.to_hex(),
        };

        let activity = match db.get_activity_by_id(payload, user_id.clone()).await {
            Ok(v) => match v {
                Some(v) => v,
                None => panic!("failed to get actvitiy"),
            },
            Err(_) => panic!("failed to get actvitiy"),
        };

        assert!(activity.data.is_some());
        assert!(activity.data.unwrap().exercise.unwrap().len() == 0);

        let update_payload = PatchActivityPayload {
            id: new_id.to_hex(),
            title: None,
            variant: None,
            group: None,
            notes: None,
            start: None,
            end: None,
            timezone: None,
            data: Some(ActivityData {
                exercise: Some(vec![
                    Exercise::Strength(StrengthExercise {
                        title: "pressups".to_string(),
                        sets: vec![Set {
                            idx: 0,
                            reps: Some(30),
                            rest: Some(60),
                            weight: None,
                            duration: None,
                        }],
                    }),
                    Exercise::Mobility(MobilityExercise {
                        title: "pressups2".to_string(),
                        sets: vec![Set {
                            idx: 0,
                            reps: None,
                            rest: Some(60),
                            weight: None,
                            duration: Some(30),
                        }],
                    }),
                    Exercise::Cardio(CardioExercise {
                        title: "running".to_string(),
                        duration: 30,
                        distance: 5000,
                    }),
                ]),
            }),
        };

        let updated_activity = db
            .update_activity_by_id(update_payload, user_id.clone())
            .await;
        assert!(updated_activity.is_ok());

        let payload = GetActivityPayload {
            id: new_id.to_hex(),
        };

        let activity = match db.get_activity_by_id(payload, user_id.clone()).await {
            Ok(v) => match v {
                Some(v) => v,
                None => panic!("failed to get actvitiy"),
            },
            Err(_) => panic!("failed to get actvitiy"),
        };

        assert!(activity.data.is_some());
        assert!(activity.data.unwrap().exercise.unwrap().len() == 3);

        let update_payload = PatchActivityPayload {
            id: new_id.to_hex(),
            title: None,
            variant: None,
            group: None,
            notes: None,
            start: None,
            end: None,
            timezone: None,
            data: Some(ActivityData {
                exercise: Some(vec![Exercise::Strength(StrengthExercise {
                    title: "pressups3".to_string(),
                    sets: vec![Set {
                        idx: 0,
                        reps: Some(30),
                        rest: Some(60),
                        weight: None,
                        duration: None,
                    }],
                })]),
            }),
        };

        let updated_activity = db
            .update_activity_by_id(update_payload, user_id.clone())
            .await;
        assert!(updated_activity.is_ok());

        let payload = GetActivityPayload {
            id: new_id.to_hex(),
        };

        let activity = match db.get_activity_by_id(payload, user_id.clone()).await {
            Ok(v) => match v {
                Some(v) => v,
                None => panic!("failed to get actvitiy"),
            },
            Err(_) => panic!("failed to get actvitiy"),
        };

        assert!(activity.data.is_some());
        assert!(activity.data.unwrap().exercise.unwrap().len() == 1);

        delete_test_activity(&db, new_id.to_hex(), user_id).await;
    }

    #[tokio::test]
    async fn delete_one() {
        let db = init_db().await;
        let (new_id, user_id) = create_test_activity(&db).await;

        let payload = DeleteActivityPayload {
            id: new_id.to_hex(),
        };

        let deleted_activity = db.delete_activity_by_id(payload, user_id).await;
        assert!(deleted_activity.is_ok());
        assert!(deleted_activity.unwrap().id == new_id);
    }
}
