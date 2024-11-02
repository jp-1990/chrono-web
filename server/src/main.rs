use std::{env, sync::Arc};

use axum::{
    extract::{MatchedPath, Request},
    http::{
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
        HeaderValue, Method,
    },
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::Key;
use database::mongodb_database::MongoDatabase;
use serde_json::Value;
use tower_http::{add_extension::AddExtensionLayer, cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use self::{
    handlers::activity_handler::{
        create_activity_handler, delete_activity_handler, get_activities_handler,
        get_activity_handler, update_activity_handler,
    },
    models::state_model::{AppState, EnvironmentVariables, GoogleCertsState},
};
use self::{
    handlers::auth_handler::{authorize, authorize_oauth, logout, register_user},
    models::state_model::InnerState,
};

mod database;
mod error;
mod handlers;
mod models;
mod utils;

async fn health_check_handler() -> Json<Value> {
    let json_response = serde_json::json!({
        "status": "success",
    });

    Json(json_response)
}

#[tokio::main]
async fn main() {
    let env = EnvironmentVariables::from_env();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                format!("{}=debug,tower_http=debug", env!("CARGO_CRATE_NAME")).into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db_uri = env
        .db_url
        .replace("%USER%", &env.db_user)
        .replace("%PASS%", &env.db_pass);

    let db = match MongoDatabase::init(&db_uri, &env.db_name).await {
        Ok(v) => {
            println!("Database connected");
            v
        }
        Err(_) => panic!("Fatal: database connection failed to initialize"),
    };

    let client = reqwest::Client::new();

    let port = &env.port.clone();

    let app_state = AppState(Arc::new(InnerState {
        db,
        client,
        env,
        key: Key::generate(),
    }));

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = Router::new()
        .route("/api/health-check", get(health_check_handler))
        .route("/api/v1/login", post(authorize))
        .route("/api/v1/oauth", post(authorize_oauth))
        .route("/api/v1/logout", post(logout))
        .route("/api/v1/register", post(register_user))
        .route("/api/v1/activity", get(get_activities_handler))
        .route("/api/v1/activity", post(create_activity_handler))
        .route(
            "/api/v1/activity/:id",
            get(get_activity_handler)
                .patch(update_activity_handler)
                .delete(delete_activity_handler),
        )
        .layer(cors)
        .layer(
            TraceLayer::new_for_http()
                // Create our own span for the request and include the matched path. The matched
                // path is useful for figuring out which handler the request was routed to.
                .make_span_with(|req: &Request| {
                    let method = req.method();
                    let uri = req.uri();

                    // axum automatically adds this extension.
                    let matched_path = req
                        .extensions()
                        .get::<MatchedPath>()
                        .map(|matched_path| matched_path.as_str());

                    tracing::debug_span!("request", %method, %uri, matched_path)
                })
                .on_failure(()),
        )
        .layer(AddExtensionLayer::new(GoogleCertsState::default()))
        .with_state(app_state.into());

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap()
}
