use std::sync::Arc;
use std::usize;
use std::{env, ops::Deref};

use axum::async_trait;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
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
use dotenv::dotenv;
use serde_json::Value;
use tokio::sync::RwLock;
use tower_http::{add_extension::AddExtensionLayer, cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use self::error::error::AppError;
use self::handlers::activity_handler::{
    create_activity_handler, delete_activity_handler, get_activities_handler, get_activity_handler,
    update_activity_handler,
};
use self::handlers::auth_handler::{authorize, authorize_oauth, logout, register_user};
use self::models::auth_model::GoogleCertsResponse;

mod database;
mod error;
mod handlers;
mod models;
mod utils;

type GoogleCertsState = Arc<RwLock<GoogleCerts>>;

#[derive(Default)]
struct GoogleCerts {
    pub exp: Option<usize>,
    pub certs: Option<GoogleCertsResponse>,
}

#[derive(Clone)]
struct AppState(Arc<InnerState>);

// deref so you can still access the inner fields easily
impl Deref for AppState {
    type Target = InnerState;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Debug)]
pub struct InnerState {
    db: MongoDatabase,
    key: Key,
    client: reqwest::Client,
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        state.0.key.clone()
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AppState
where
    Self: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        Ok(Self::from_ref(state))
    }
}

async fn health_check_handler() -> Json<Value> {
    let json_response = serde_json::json!({
        "status": "success",
    });

    Json(json_response)
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                format!("{}=debug,tower_http=debug", env!("CARGO_CRATE_NAME")).into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

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

    let client = reqwest::Client::new();

    let app_state = AppState(Arc::new(InnerState {
        db,
        client,
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

    let port = match env::var("PORT") {
        Ok(v) => v,
        Err(_) => panic!("Error loading PORT. Ensure PORT env var is set"),
    };

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap()
}
