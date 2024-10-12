use mongodb::bson::oid::ObjectId;
use mongodb::bson::Bson;
use serde::{Deserialize, Serialize};

#[derive(PartialEq, Copy, Clone, Debug, Serialize, Deserialize)]
pub enum Role {
    Admin,
    User,
}

impl From<&str> for Role {
    fn from(s: &str) -> Role {
        match s {
            "admin" => Role::Admin,
            "user" => Role::User,
            "Admin" => Role::Admin,
            "User" => Role::User,
            _ => panic!("invalid role!"),
        }
    }
}

impl From<Role> for String {
    fn from(role: Role) -> String {
        match role {
            Role::Admin => "admin".into(),
            Role::User => "user".into(),
        }
    }
}

impl From<Bson> for Role {
    fn from(bson: Bson) -> Role {
        if let Bson::String(s) = bson {
            s.as_str().into()
        } else {
            panic!("expected Bson::String")
        }
    }
}

impl Into<Bson> for Role {
    fn into(self) -> Bson {
        let s: String = self.into();
        Bson::String(s)
    }
}

#[non_exhaustive]
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub email: String,
    pub pass: String,
    pub role: Role,
    pub active: bool,
    pub verified: bool,
    pub forename: String,
    pub surname: String,
    pub img: String,
    #[serde(rename = "createdAt")]
    pub created_at: mongodb::bson::DateTime,
    #[serde(rename = "__v")]
    pub v: u32,
}

#[derive(Debug, Deserialize)]
pub struct AuthPayload {
    pub email: String,
    pub pass: String,
}
