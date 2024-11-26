use mongodb::bson::oid::ObjectId;
use mongodb::bson::serde_helpers::{
    serialize_bson_datetime_as_rfc3339_string, serialize_object_id_as_hex_string,
};
use mongodb::bson::Bson;
use serde::{Deserialize, Serialize};

#[derive(PartialEq, Copy, Clone, Debug, Serialize, Deserialize)]
pub enum ActivityVariant {
    Default,
    Exercise,
}

impl From<&str> for ActivityVariant {
    fn from(s: &str) -> ActivityVariant {
        match s {
            "default" => ActivityVariant::Default,
            "exercise" => ActivityVariant::Exercise,
            _ => panic!("invalid activity variant!"),
        }
    }
}

impl From<ActivityVariant> for String {
    fn from(variant: ActivityVariant) -> String {
        match variant {
            ActivityVariant::Default => "default".into(),
            ActivityVariant::Exercise => "exercise".into(),
        }
    }
}

impl From<Bson> for ActivityVariant {
    fn from(bson: Bson) -> ActivityVariant {
        if let Bson::String(s) = bson {
            s.as_str().into()
        } else {
            panic!("expected Bson::String")
        }
    }
}

impl Into<Bson> for ActivityVariant {
    fn into(self) -> Bson {
        let s: String = self.into();
        Bson::String(s)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExerciseVariant {
    Strength,
    Mobility,
    Cardio,
}

impl From<&str> for ExerciseVariant {
    fn from(s: &str) -> ExerciseVariant {
        match s {
            "strength" => ExerciseVariant::Strength,
            "mobility" => ExerciseVariant::Mobility,
            "cardio" => ExerciseVariant::Cardio,
            _ => panic!("invalid activity variant!"),
        }
    }
}

impl From<ExerciseVariant> for String {
    fn from(variant: ExerciseVariant) -> String {
        match variant {
            ExerciseVariant::Strength => "strength".into(),
            ExerciseVariant::Mobility => "mobility".into(),
            ExerciseVariant::Cardio => "cardio".into(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Set {
    pub idx: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reps: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rest: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Split {
    pub idx: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub distance: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StrengthExercise {
    pub title: String,
    pub sets: Vec<Set>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MobilityExercise {
    pub title: String,
    pub sets: Vec<Set>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CardioExercise {
    pub title: String,
    pub duration: u32,
    pub distance: u32,
    pub splits: Option<Vec<Split>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "variant")]
pub enum Exercise {
    Strength(StrengthExercise),
    Mobility(MobilityExercise),
    Cardio(CardioExercise),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActivityData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exercise: Option<Vec<Exercise>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetActivityPayload {
    #[serde(rename = "_id")]
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetActivitiesPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timezone: Option<i16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<ActivityVariant>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostActivityPayload {
    pub title: String,
    pub variant: ActivityVariant,
    pub group: String,
    pub notes: Option<String>,
    pub start: String,
    pub end: String,
    pub timezone: i16,
    pub data: Option<ActivityData>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchActivityBody {
    pub variant: Option<ActivityVariant>,
    pub title: Option<String>,
    pub group: Option<String>,
    pub notes: Option<String>,
    pub start: Option<String>,
    pub end: Option<String>,
    pub timezone: Option<i16>,
    pub data: Option<ActivityData>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchActivityPayload {
    #[serde(rename = "_id")]
    pub id: String,
    pub variant: Option<ActivityVariant>,
    pub title: Option<String>,
    pub group: Option<String>,
    pub notes: Option<String>,
    pub start: Option<String>,
    pub end: Option<String>,
    pub timezone: Option<i16>,
    pub data: Option<ActivityData>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteActivityPayload {
    #[serde(rename = "_id")]
    pub id: String,
}

#[non_exhaustive]
#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub variant: ActivityVariant,
    pub title: String,
    pub group: String,
    pub notes: String,
    pub start: mongodb::bson::DateTime,
    pub end: mongodb::bson::DateTime,
    pub timezone: i16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<ActivityData>,
    #[serde(rename = "createdAt")]
    pub created_at: mongodb::bson::DateTime,
    pub user: ObjectId,
    #[serde(rename = "__v")]
    pub v: u32,
}

impl Activity {
    pub fn new(
        variant: ActivityVariant,
        title: String,
        group: String,
        notes: String,
        start: String,
        end: String,
        timezone: i16,
        data: Option<ActivityData>,
        user: String,
    ) -> Self {
        let start = mongodb::bson::DateTime::parse_rfc3339_str(start).unwrap();
        let end = mongodb::bson::DateTime::parse_rfc3339_str(end).unwrap();

        Self {
            id: ObjectId::new(),
            variant,
            title,
            group,
            notes,
            start,
            end,
            timezone,
            data,
            created_at: mongodb::bson::DateTime::now(),
            user: ObjectId::parse_str(user).expect("failed to parse string to ObjectId"),
            v: 1,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityResponse {
    #[serde(rename = "id", serialize_with = "serialize_object_id_as_hex_string")]
    pub _id: ObjectId,
    pub variant: ActivityVariant,
    pub title: String,
    pub group: String,
    pub notes: String,
    #[serde(serialize_with = "serialize_bson_datetime_as_rfc3339_string")]
    pub start: mongodb::bson::DateTime,
    #[serde(serialize_with = "serialize_bson_datetime_as_rfc3339_string")]
    pub end: mongodb::bson::DateTime,
    pub timezone: i16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<ActivityData>,
    #[serde(
        rename = "createdAt",
        serialize_with = "serialize_bson_datetime_as_rfc3339_string"
    )]
    pub created_at: mongodb::bson::DateTime,
    #[serde(serialize_with = "serialize_object_id_as_hex_string")]
    pub user: ObjectId,
    #[serde(rename = "v")]
    pub __v: u32,
}

impl From<Activity> for ActivityResponse {
    fn from(activity: Activity) -> ActivityResponse {
        ActivityResponse {
            _id: activity.id,
            variant: activity.variant,
            title: activity.title,
            group: activity.group,
            notes: activity.notes,
            start: activity.start,
            end: activity.end,
            timezone: activity.timezone,
            data: activity.data,
            created_at: activity.created_at,
            user: activity.user,
            __v: activity.v,
        }
    }
}

impl From<&Activity> for ActivityResponse {
    fn from(activity: &Activity) -> ActivityResponse {
        ActivityResponse {
            _id: activity.id,
            variant: activity.variant,
            title: activity.title.clone(),
            group: activity.group.clone(),
            notes: activity.notes.clone(),
            start: activity.start,
            end: activity.end,
            timezone: activity.timezone,
            data: activity.data.clone(),
            created_at: activity.created_at,
            user: activity.user,
            __v: activity.v,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityDelete {
    #[serde(rename = "_id")]
    pub id: ObjectId,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityDeleteResponse {
    #[serde(rename = "_id", serialize_with = "serialize_object_id_as_hex_string")]
    pub id: ObjectId,
}

impl From<ActivityDelete> for ActivityDeleteResponse {
    fn from(activity: ActivityDelete) -> ActivityDeleteResponse {
        ActivityDeleteResponse { id: activity.id }
    }
}

impl From<&ActivityDelete> for ActivityDeleteResponse {
    fn from(activity: &ActivityDelete) -> ActivityDeleteResponse {
        ActivityDeleteResponse { id: activity.id }
    }
}
