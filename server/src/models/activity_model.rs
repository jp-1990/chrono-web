use mongodb::bson::oid::ObjectId;
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

#[derive(Debug, Serialize, Deserialize)]
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

#[non_exhaustive]
#[derive(Debug, Serialize, Deserialize)]
pub struct StrengthExercise {
    title: String,
    sets: Vec<Set>,
}

impl StrengthExercise {
    pub fn new(title: String, sets: Vec<Set>) -> StrengthExercise {
        Self { title, sets }
    }
}

#[non_exhaustive]
#[derive(Debug, Serialize, Deserialize)]
pub struct MobilityExercise {
    title: String,
    sets: Vec<Set>,
}

impl MobilityExercise {
    pub fn new(title: String, sets: Vec<Set>) -> MobilityExercise {
        Self { title, sets }
    }
}

#[non_exhaustive]
#[derive(Debug, Serialize, Deserialize)]
pub struct CardioExercise {
    title: String,
    duration: u32,
    distance: u32,
}

impl CardioExercise {
    pub fn new(title: String, duration: u32, distance: u32) -> CardioExercise {
        Self {
            title,
            duration,
            distance,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "variant")]
pub enum Exercise {
    Strength(StrengthExercise),
    Mobility(MobilityExercise),
    Cardio(CardioExercise),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exercise: Option<Vec<Exercise>>,
}

#[derive(Debug, Serialize)]
pub struct GetActivityPayload<'a> {
    #[serde(rename = "_id")]
    pub id: &'a str,
}

#[derive(Debug, Serialize)]
pub struct GetActivitiesPayload<'a> {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<ActivityVariant>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<mongodb::bson::DateTime>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<mongodb::bson::DateTime>,
}

#[derive(Debug, Serialize)]
pub struct PostActivityPayload<'a> {
    pub title: &'a str,
    pub variant: ActivityVariant,
    pub group: Option<&'a str>,
    pub notes: Option<&'a str>,
    pub start: mongodb::bson::DateTime,
    pub end: mongodb::bson::DateTime,
    pub timezone: i8,
    pub data: Option<ActivityData>,
}

#[derive(Debug, Serialize)]
pub struct PatchActivityPayload<'a> {
    #[serde(rename = "_id")]
    pub id: &'a str,
    pub variant: Option<ActivityVariant>,
    pub title: Option<&'a str>,
    pub group: Option<&'a str>,
    pub notes: Option<&'a str>,
    pub start: Option<mongodb::bson::DateTime>,
    pub end: Option<mongodb::bson::DateTime>,
    pub timezone: Option<i8>,
    pub data: Option<ActivityData>,
}

#[derive(Debug, Serialize)]
pub struct DeleteActivityPayload<'a> {
    #[serde(rename = "_id")]
    pub id: &'a str,
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
    pub timezone: i8,
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
        start: mongodb::bson::DateTime,
        end: mongodb::bson::DateTime,
        timezone: i8,
        data: Option<ActivityData>,
        user: String,
    ) -> Self {
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
