use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use axum_extra::extract::PrivateCookieJar;

use crate::{
    error::error::AppError,
    models::activity_model::{
        ActivityDeleteResponse, ActivityResponse, DeleteActivityPayload, GetActivitiesPayload,
        GetActivityPayload, PatchActivityBody, PatchActivityPayload, PostActivityPayload,
    },
    utils::auth::AccessClaims,
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

pub async fn create_activity_handler(
    claims: AccessClaims,
    Extension(jar): Extension<PrivateCookieJar>,
    State(app_state): State<AppState>,
    Json(body): Json<PostActivityPayload>,
) -> Result<(PrivateCookieJar, (StatusCode, Json<ActivityResponse>)), AppError> {
    match app_state.db.create_activity(body, claims.sub).await {
        Ok(res) => match res {
            Some(activity) => Ok((
                jar,
                (StatusCode::CREATED, Json(ActivityResponse::from(activity))),
            )),
            None => Err(AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to create activity!",
            )),
        },
        Err(_) => Err(AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "failed to create activity!",
        )),
    }
}

// curl -X GET http://localhost:8000/api/v1/activity/66cc8f30ef7a9d4f94f9ad03 -H "Content-Type: application/json"

pub async fn get_activity_handler(
    claims: AccessClaims,
    Extension(jar): Extension<PrivateCookieJar>,
    Path(id): Path<String>,
    State(app_state): State<AppState>,
) -> Result<(PrivateCookieJar, (StatusCode, Json<ActivityResponse>)), AppError> {
    let payload = GetActivityPayload { id };
    match app_state.db.get_activity_by_id(payload, claims.sub).await {
        Ok(res) => match res {
            Some(v) => {
                let activity = ActivityResponse::from(v);
                Ok((jar, (StatusCode::OK, Json(activity))))
            }
            None => Err(AppError::new(StatusCode::NOT_FOUND, "activity not found!")),
        },
        Err(_) => Err(AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "failed to get activity!",
        )),
    }
}

// curl -GET "http://localhost:8000/api/v1/activity" --data-urlencode "title=My New Activity"
// curl -GET "http://localhost:8000/api/v1/activity"

pub async fn get_activities_handler(
    claims: AccessClaims,
    Extension(jar): Extension<PrivateCookieJar>,
    query: Option<Query<GetActivitiesPayload>>,
    State(app_state): State<AppState>,
) -> Result<(PrivateCookieJar, (StatusCode, Json<Vec<ActivityResponse>>)), AppError> {
    let Query(query) = query.unwrap();

    match app_state.db.get_activities(query, claims.sub).await {
        Ok(res) => Ok((
            jar,
            (
                StatusCode::OK,
                Json(res.iter().map(|a| ActivityResponse::from(a)).collect()),
            ),
        )),
        Err(_) => Err(AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "failed to get activities!",
        )),
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

pub async fn update_activity_handler(
    claims: AccessClaims,
    Extension(jar): Extension<PrivateCookieJar>,
    Path(id): Path<String>,
    State(app_state): State<AppState>,
    Json(body): Json<PatchActivityBody>,
) -> Result<(PrivateCookieJar, (StatusCode, Json<ActivityResponse>)), AppError> {
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
        .update_activity_by_id(payload, claims.sub)
        .await
    {
        Ok(v) => match v {
            Some(res) => Ok((jar, (StatusCode::OK, Json(ActivityResponse::from(res))))),
            None => Err(AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to update activity!",
            )),
        },
        Err(_) => Err(AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "failed to update activity!",
        )),
    }
}

// curl -X DELETE http://localhost:8000/api/v1/activity/66cc8f30ef7a9d4f94f9ad03

pub async fn delete_activity_handler(
    claims: AccessClaims,
    Extension(jar): Extension<PrivateCookieJar>,
    Path(id): Path<String>,
    State(app_state): State<AppState>,
) -> Result<(PrivateCookieJar, (StatusCode, Json<ActivityDeleteResponse>)), AppError> {
    let payload = DeleteActivityPayload { id };
    match app_state
        .db
        .delete_activity_by_id(payload, claims.sub)
        .await
    {
        Ok(res) => Ok((
            jar,
            (StatusCode::OK, Json(ActivityDeleteResponse::from(res))),
        )),
        Err(_) => Err(AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "failed to delete activity!",
        )),
    }
}
