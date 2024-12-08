use std::borrow::Cow;
use std::ops::Deref;
use std::sync::Arc;

use axum::async_trait;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use axum_extra::extract::cookie::Key;
use tokio::sync::RwLock;

use crate::database::mongodb_database::MongoDatabase;
use crate::error::error::AppError;

#[derive(Clone, Debug)]
pub struct EnvironmentVariables {
    pub db_url: Cow<'static, str>,
    pub db_name: Cow<'static, str>,
    pub db_user: Cow<'static, str>,
    pub db_pass: Cow<'static, str>,
    pub google_certs_urls: Cow<'static, str>,
    pub google_token_aud: Cow<'static, str>,
    pub hmac_key: Cow<'static, str>,
    pub port: u16,
}

impl EnvironmentVariables {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();

        Self {
            db_url: match dotenv::var("DATABASE_URL") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure DATABASE_URL env var is set"),
            },
            db_name: match dotenv::var("DATABASE_NAME") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure DATABASE_NAME env var is set"),
            },
            db_user: match dotenv::var("DATABASE_USER") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure DATABASE_USER env var is set"),
            },
            db_pass: match dotenv::var("DATABASE_PASS") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure DATABASE_PASS env var is set"),
            },
            google_certs_urls: match dotenv::var("GOOGLE_CERTS_URL") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure GOOGLE_CERTS_URL env var is set"),
            },
            google_token_aud: match dotenv::var("GOOGLE_TOKEN_AUD") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure GOOGLE_TOKEN_AUD env var is set"),
            },
            hmac_key: match dotenv::var("HMAC_KEY") {
                Ok(url) => url.into(),
                Err(_) => panic!("Fatal: ensure HMAC_KEY env var is set"),
            },
            port: match dotenv::var("PORT") {
                Ok(port) => port.parse().unwrap_or(8080),
                _ => 8080,
            },
        }
    }
}

use super::auth_model::GoogleCertsResponse;

pub type GoogleCertsState = Arc<RwLock<GoogleCerts>>;

#[derive(Default)]
pub struct GoogleCerts {
    pub exp: Option<usize>,
    pub certs: Option<GoogleCertsResponse>,
}

#[derive(Clone)]
pub struct AppState(pub Arc<InnerState>);

// deref so you can still access the inner fields easily
impl Deref for AppState {
    type Target = InnerState;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Debug)]
pub struct InnerState {
    pub db: MongoDatabase,
    pub key: Key,
    pub client: reqwest::Client,
    pub env: EnvironmentVariables,
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
