use core::panic;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use mongodb::results::{DeleteResult, InsertOneResult, UpdateResult};

use crate::{
    models::activity_model::{
        ActivityResponse, DeleteActivityPayload, GetActivitiesPayload, GetActivityPayload,
        PatchActivityBody, PatchActivityPayload, PostActivityPayload,
    },
    AppState,
};

// curl -X POST http://localhost:8000/api/v1/activity -H "Content-Type: application/json" -d '{
//   "title": "My New Activity",
//   "variant": "Default",
//   "group": "Group 1",
//   "notes": "Some notes about the activity",
//   "start": "2024-08-25T14:00:00Z",
//   "end": "2024-08-25T16:00:00Z",
//   "timezone": -4
// }'

//todo:: return activityresponse
//todo:: error handling

pub async fn create_activity_handler(
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<PostActivityPayload>,
) -> (StatusCode, Json<InsertOneResult>) {
    match app_state
        .db
        .create_activity(body, app_state.user_id.clone())
        .await
    {
        Ok(res) => (StatusCode::CREATED, Json(res)),
        Err(_) => panic!("failed to create activity"),
    }
}

// curl -X GET http://localhost:8000/api/v1/activity/66cc8f30ef7a9d4f94f9ad03 -H "Content-Type: application/json"

//todo:: error handling

pub async fn get_activity_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> (StatusCode, Json<ActivityResponse>) {
    let payload = GetActivityPayload { id };
    match app_state
        .db
        .get_activity_by_id(payload, app_state.user_id.clone())
        .await
    {
        Ok(res) => match res {
            Some(v) => {
                let activity = ActivityResponse::from(v);
                (StatusCode::OK, Json(activity))
            }
            None => panic!("failed to get activity"),
        },
        Err(_) => panic!("failed to get activity"),
    }
}

// curl -G "http://localhost:8000/api/v1/activities" --data-urlencode "title=My New Activity"

//todo:: error handling

pub async fn get_activities_handler(
    query: Option<Query<GetActivitiesPayload>>,
    State(app_state): State<Arc<AppState>>,
) -> (StatusCode, Json<Vec<ActivityResponse>>) {
    let Query(query) = query.unwrap();

    match app_state
        .db
        .get_activities(query, app_state.user_id.clone())
        .await
    {
        Ok(res) => (
            StatusCode::OK,
            Json(res.iter().map(|a| ActivityResponse::from(a)).collect()),
        ),
        Err(_) => panic!("failed to get activities"),
    }
}

// curl -X PATCH http://localhost:8000/api/v1/activity/66cc8f30ef7a9d4f94f9ad03 -H "Content-Type: application/json" -d '{
//   "title": "UPDATED",
//   "variant": "Default",
//   "group": "UPDATED",
//   "notes": "UPDATED",
//   "start": "2024-08-25T12:00:00Z",
//   "end": "2024-08-25T18:00:00Z",
//   "timezone": 0
// }'

//todo:: return activityresponse
//todo:: error handling

pub async fn update_activity_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<PatchActivityBody>,
) -> (StatusCode, Json<UpdateResult>) {
    let payload = PatchActivityPayload {
        id,
        variant: body.variant,
        title: body.title,
        group: body.group,
        notes: body.notes,
        start: body.start,
        end: body.end,
        timezone: body.timezone,
        data: body.data,
    };
    match app_state
        .db
        .update_activity_by_id(payload, app_state.user_id.clone())
        .await
    {
        Some(v) => match v {
            Ok(res) => (StatusCode::OK, Json(res)),
            Err(_) => panic!("failed to update activity"),
        },
        _ => panic!("failed to update activity"),
    }
}

// curl -X DELETE http://localhost:8000/api/v1/activity/66cc8f30ef7a9d4f94f9ad03

//todo:: return deleted id
//todo:: error handling

pub async fn delete_activity_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> (StatusCode, Json<DeleteResult>) {
    let payload = DeleteActivityPayload { id };
    match app_state
        .db
        .delete_activity_by_id(payload, app_state.user_id.clone())
        .await
    {
        Ok(res) => (StatusCode::OK, Json(res)),
        Err(_) => panic!("failed to delete activity"),
    }
}
