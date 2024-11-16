use std::collections::HashMap;
use std::{u32, usize};

use axum::http::StatusCode;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::serde_helpers::serialize_object_id_as_hex_string;
use mongodb::bson::Bson;
use serde::{Deserialize, Serialize};

use crate::error::error::AppError;

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
    pub activities: HashMap<String, String>,
    pub verified: bool,
    #[serde(rename = "givenName")]
    pub given_name: String,
    #[serde(rename = "familyName")]
    pub family_name: String,
    pub img: String,
    #[serde(rename = "createdAt")]
    pub created_at: mongodb::bson::DateTime,
    #[serde(rename = "__v")]
    pub v: u32,
}

impl User {
    pub fn new(
        email: String,
        pass: String,
        given_name: String,
        family_name: String,
    ) -> Result<Self, AppError> {
        match bcrypt::hash(pass, 12) {
            Ok(hash) => Ok(Self {
                id: ObjectId::new(),
                given_name,
                family_name,
                email,
                pass: hash,
                role: Role::User,
                active: true,
                activities: HashMap::new(),
                verified: false,
                img: String::from(""),
                created_at: mongodb::bson::DateTime::now(),
                v: 1,
            }),
            Err(_) => Err(AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to create user",
            )),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    #[serde(rename = "id", serialize_with = "serialize_object_id_as_hex_string")]
    pub _id: ObjectId,
    pub email: String,
    pub role: Role,
    pub activities: HashMap<String, String>,
    pub verified: bool,
    #[serde(rename = "givenName")]
    pub given_name: String,
    #[serde(rename = "familyName")]
    pub family_name: String,
    pub img: String,
}

impl From<User> for UserResponse {
    fn from(value: User) -> Self {
        UserResponse {
            _id: value.id,
            email: value.email,
            role: value.role,
            activities: value.activities,
            verified: value.verified,
            given_name: value.given_name,
            family_name: value.family_name,
            img: value.img,
        }
    }
}

impl From<RegisterUserPayload> for User {
    fn from(payload: RegisterUserPayload) -> User {
        User::new(
            payload.email,
            payload.pass,
            payload.given_name,
            payload.family_name,
        )
        .expect("")
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterUserPayload {
    pub email: String,
    pub pass: String,
    #[serde(rename = "givenName")]
    pub given_name: String,
    #[serde(rename = "familyName")]
    pub family_name: String,
}
