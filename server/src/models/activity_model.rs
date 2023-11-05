use mongodb::bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub description: String,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    pub title: String,
    pub start: DateTime,
    pub end: DateTime,
    #[serde(rename = "colour")]
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    pub user: ObjectId,
    #[serde(rename = "__v")]
    pub v: u8,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewActivity {
    pub description: String,
    pub title: String,
    pub start: String,
    pub end: String,
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActivityBody {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActivity {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<DateTime>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<DateTime>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
}
