use std::env;

use axum::extract::FromRef;
use axum::{async_trait, extract::FromRequestParts, http::request::Parts};
use axum_extra::extract::cookie::{Cookie, Key, SameSite};
use axum_extra::extract::PrivateCookieJar;
use chrono::Utc;
use jsonwebtoken::errors::{Error, ErrorKind};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::error::AuthError;

pub fn generate_jti() -> String {
    Uuid::new_v4().to_string()
}

pub struct Keys {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
}

impl Keys {
    pub fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub jti: String,
}

impl RefreshClaims {
    pub fn new(sub: String, exp: Option<usize>) -> Self {
        // todo:: set true expiry time
        let iat = (Utc::now().naive_utc()).and_utc().timestamp() as usize;
        let exp = match exp {
            Some(v) => v,
            None => (Utc::now().naive_utc() + chrono::Duration::minutes(5))
                .and_utc()
                .timestamp() as usize,
        };

        Self {
            jti: generate_jti(),
            sub,
            iat,
            exp,
        }
    }

    pub fn build_token(&self, key: EncodingKey) -> Result<String, Error> {
        encode(&Header::default(), self, &key)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
    pub iat: usize,
    pub jti: String,
}

impl AccessClaims {
    pub fn new(sub: &String, email: &String) -> Self {
        // todo:: set true expiry time
        let iat = (Utc::now().naive_utc()).and_utc().timestamp() as usize;
        let exp = (Utc::now().naive_utc() + chrono::Duration::minutes(0))
            .and_utc()
            .timestamp() as usize;

        Self {
            jti: generate_jti(),
            sub: sub.to_string(),
            email: email.to_string(),
            iat,
            exp,
        }
    }

    pub fn build_token(&self, key: EncodingKey) -> Result<String, Error> {
        encode(&Header::default(), self, &key)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AccessClaims
where
    S: Send + Sync,
    Key: FromRef<S>,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let hmac_key = match env::var("HMAC_KEY") {
            Ok(v) => v,
            Err(_) => panic!("Error loading HMAC_KEY. Ensure HMAC_KEY env var is set"),
        };

        let access_keys = Keys::new(hmac_key.as_bytes());
        let refresh_keys = Keys::new(hmac_key.as_bytes());

        let jar = PrivateCookieJar::<Key>::from_request_parts(parts, &state)
            .await
            .map_err(|_| AuthError::InternalError)?;

        // extract token from cookie
        let access_token = match jar.get("access").map(|cookie| cookie.value().to_owned()) {
            Some(value) => value,
            None => String::from(""),
        };

        // Decode the user data
        let (access_token_data, access_token_expired) = match decode::<AccessClaims>(
            &access_token,
            &access_keys.decoding,
            &Validation::default(),
        ) {
            Ok(token) => Ok((token, false)),
            Err(err) => match err.kind() {
                // if token has expired decode anyway
                ErrorKind::ExpiredSignature => {
                    let mut validation = Validation::default();
                    validation.validate_exp = false; // Disable expiration validation

                    let token_data =
                        decode::<AccessClaims>(&access_token, &access_keys.decoding, &validation)
                            .map_err(|_| AuthError::InvalidToken)?;

                    Ok((token_data, true))
                }
                _ => Err(err),
            },
        }
        .map_err(|_| AuthError::InvalidToken)?;

        if access_token_expired {
            // extract token from cookie
            let refresh_token = match jar.get("refresh").map(|cookie| cookie.value().to_owned()) {
                Some(value) => value,
                None => String::from(""),
            };

            let refresh_token_data = decode::<RefreshClaims>(
                &refresh_token,
                &refresh_keys.decoding,
                &Validation::default(),
            )
            .map_err(|_| AuthError::InvalidToken)?;

            if refresh_token_data.claims.sub != access_token_data.claims.sub {
                return Err(AuthError::InvalidToken);
            }

            // todo:: check refresh token has not been used before
            // todo:: if it has - revoke all associated tokens

            // create new claims
            let new_access_claims = AccessClaims::new(
                &access_token_data.claims.sub,
                &access_token_data.claims.email,
            );
            let new_refresh_claims = RefreshClaims::new(
                refresh_token_data.claims.sub,
                Some(refresh_token_data.claims.exp),
            );

            // create new tokens
            let new_access_token = new_access_claims
                .build_token(access_keys.encoding)
                .map_err(|_| AuthError::InternalError)?;

            let new_refresh_token = new_refresh_claims
                .build_token(refresh_keys.encoding)
                .map_err(|_| AuthError::InternalError)?;

            // create cookies
            let new_access_cookie = Cookie::build(("access", new_access_token))
                // .domain("localhost")
                .path("/")
                .same_site(SameSite::Lax)
                .secure(false) // todo:: in prod = true
                .http_only(true);

            let new_refresh_cookie = Cookie::build(("refresh", new_refresh_token))
                // .domain("localhost")
                .path("/")
                .same_site(SameSite::Lax)
                .secure(false) // todo:: in prod = true
                .http_only(true);

            // todo:: link and blacklist tokens old

            parts
                .extensions
                .insert::<PrivateCookieJar>(jar.add(new_access_cookie).add(new_refresh_cookie));

            return Ok(new_access_claims);
        }

        parts.extensions.insert(jar);

        Ok(access_token_data.claims)
    }
}
