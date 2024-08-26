use std::env;
use std::sync::Arc;

use axum::{
    http::{
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
        HeaderValue, Method,
    },
    routing::{get, post},
    Json, Router,
};
use database::mongodb_database::MongoDatabase;
use dotenv::dotenv;
use serde_json::Value;
use tower_http::cors::CorsLayer;

use self::handlers::activity_handler::{
    create_activity_handler, delete_activity_handler, get_activities_handler, get_activity_handler,
    update_activity_handler,
};

mod database;
mod handlers;
mod models;
mod utils;

pub struct AppState {
    db: MongoDatabase,
    user_id: String,
}

async fn health_check_handler() -> Json<Value> {
    let json_response = serde_json::json!({
        "status": "success",
    });

    Json(json_response)
}

//todo:: error handling

#[tokio::main]
async fn main() {
    dotenv().ok();

    let uri = match env::var("CLUSTER") {
        Ok(v) => v,
        Err(_) => panic!("Error loading CLUSTER. Ensure CLUSTER env var is set"),
    };
    let db_name = "task-tracker-testing";

    let db = match MongoDatabase::init(&uri, db_name).await {
        Ok(v) => {
            println!("Database connected");
            v
        }
        Err(_) => panic!("database connection failed to initialize"),
    };

    let app_state = Arc::new(AppState {
        db: db.clone(),
        user_id: String::from("5f00b442bab42e04c05f5a9e"),
    });

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = Router::new()
        .route("/api/health-check", get(health_check_handler))
        .route("/api/v1/activity", get(get_activities_handler))
        .route("/api/v1/activity", post(create_activity_handler))
        .route(
            "/api/v1/activity/:id",
            get(get_activity_handler)
                .patch(update_activity_handler)
                .delete(delete_activity_handler),
        )
        .with_state(app_state)
        .layer(cors);

    let port = match env::var("PORT") {
        Ok(v) => v,
        Err(_) => panic!("Error loading PORT. Ensure PORT env var is set"),
    };

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    println!("Server started successfully");
    println!("Server running on port: {}...", port);

    axum::serve(listener, app).await.unwrap()
}
