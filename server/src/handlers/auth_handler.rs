use std::{env, usize};

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::{Extension, Json};
use axum_extra::extract::cookie::{Cookie, SameSite};
use axum_extra::extract::PrivateCookieJar;
use axum_macros::debug_handler;
use chrono::Utc;
use dotenv::dotenv;
use jsonwebtoken::errors::ErrorKind;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use mongodb::bson::oid::ObjectId;
use regex::Regex;
use reqwest::header::CACHE_CONTROL;
use time::OffsetDateTime;

use crate::error::error::AuthError;
use crate::models::auth_model::{
    AuthPayload, GoogleCertsResponse, GoogleClaims, RegisterUserPayload, TokenDB,
};
use crate::utils::auth::{AccessClaims, Keys, RefreshClaims};
use crate::utils::utils::generate_password;
use crate::{AppState, GoogleCerts, GoogleCertsState};

/*
 db collection:
    tokens:
    uid: objectId
    jti: index
    exp: ttl index
    black: boolean

 auth flow:

 no tokens:
 user logs in
 create auth/refresh tokens
 add tokens to db
 return auth/refresh token in cookies

 valid auth/refresh token:
 user makes api request
 validate token
 ensure token is not blacklisted - if it is, return unauthorized
 else, return data

 invalid auth/valid refresh token:
 user makes api request - validate token
 confirm invalid
 confirm valid refresh token
 confirm refresh token not blacklisted
 - if it is, blacklist all tokens associated with this user
 - return unauthorized
 else, use refresh token to generate new auth/refresh tokens
 blacklist old refresh token
 set new tokens to cookies
 return data

 invalid auth/refresh token:
 return unauthorized
*/

// curl -X POST http://localhost:8000/api/v1/auth -H 'Content-Type: application/json' \ -d '{"email":"","pass":""}'

// todo:: better way to use env vars

pub async fn authorize(
    State(app_state): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<(StatusCode, PrivateCookieJar), AuthError> {
    let hmac_key = match env::var("HMAC_KEY") {
        Ok(v) => v,
        Err(_) => panic!("Error loading HMAC_KEY. Ensure HMAC_KEY env var is set"),
    };

    let access_keys = Keys::new(hmac_key.as_bytes());
    let refresh_keys = Keys::new(hmac_key.as_bytes());

    // Check if the user sent the credentials
    if body.email.is_empty() || body.pass.is_empty() {
        return Err(AuthError::MissingCredentials);
    }

    let email = body.email.clone();
    let pass = body.pass.clone();

    // fetch user
    let user = match app_state.db.get_user_by_email(&body.email).await {
        Ok(res) => match res {
            Some(v) => v,
            None => return Err(AuthError::WrongCredentials),
        },
        Err(_) => return Err(AuthError::InternalError),
    };

    // verify password
    match bcrypt::verify(&pass, &user.pass) {
        Ok(v) => {
            if v == false {
                return Err(AuthError::WrongCredentials);
            }
        }
        Err(_) => return Err(AuthError::InternalError),
    }

    // create tokens
    let access_claims = AccessClaims::new(&user.id.to_string(), &email);
    let refresh_claims = RefreshClaims::new(&user.id.to_string(), None);

    let access_token = access_claims
        .build_token(access_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    let refresh_token = refresh_claims
        .build_token(refresh_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    // save token jtis to db
    let access_token_db = TokenDB::new(user.id, access_claims.jti, access_claims.exp);
    let refresh_token_db = TokenDB::new(user.id, refresh_claims.jti, refresh_claims.exp);
    let _ = app_state.db.create_token(access_token_db).await;
    let _ = app_state.db.create_token(refresh_token_db).await;

    // create cookies
    let access_cookie = Cookie::build(("access", access_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    let refresh_cookie = Cookie::build(("refresh", refresh_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    Ok((StatusCode::OK, jar.add(access_cookie).add(refresh_cookie)))
}

/*
// google certs url 'https://www.googleapis.com/oauth2/v3/certs'
// https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/oauth2client.ts#L1265

 const certificates = res.data;

 const cacheControl = res ? res.headers['cache-control'] : undefined;
 let cacheAge = -1;
 if (cacheControl) {
   const pattern = new RegExp('max-age=([0-9]*)');
   const regexResult = pattern.exec(cacheControl as string);
   if (regexResult && regexResult.length === 2) {
     // Cache results with max-age (in seconds)
     cacheAge = Number(regexResult[1]) * 1000; // milliseconds
   }
 }

 const now = new Date();
 this.certificateExpiry =
 cacheAge === -1 ? null : new Date(now.getTime() + cacheAge);
*/

#[debug_handler]
pub async fn authorize_oauth(
    State(app_state): State<AppState>,
    Extension(google_certs): Extension<GoogleCertsState>,
    jar: PrivateCookieJar,
    headers: HeaderMap,
) -> Result<(StatusCode, PrivateCookieJar), AuthError> {
    dotenv().ok();

    // get jwt from headers and decode it
    let jwt = match headers.get("Authorization") {
        Some(v) => match v.to_str() {
            Ok(v) => Ok(v),
            Err(_) => Err(AuthError::InternalError),
        },
        _ => Err(AuthError::InternalError),
    }?;

    let now_timestamp = (Utc::now().naive_utc()).and_utc().timestamp() as usize;

    let certs_state: GoogleCerts;
    {
        let lock = &google_certs.read().await;
        certs_state = GoogleCerts {
            certs: lock.certs.clone(),
            exp: lock.exp,
        }
    };

    // get certs from app_state
    let certs = match (&certs_state.certs, &certs_state.exp) {
        (Some(certs), Some(exp)) if exp > &now_timestamp => certs.clone(),
        // if none or expired - fetch certs and save to app_state
        _ => {
            let certs_url = match env::var("GOOGLE_CERTS_URL") {
                Ok(v) => v.to_string(),
                Err(_) => format!("Error loading env variable"),
            };

            let res = match app_state.client.get(certs_url).send().await {
                Ok(v) => Ok(v),
                Err(_) => Err(AuthError::InternalError),
            }?;

            // extract the Cache-Control header
            let cache_control_header = res
                .headers()
                .get(CACHE_CONTROL)
                .and_then(|value| value.to_str().ok());

            // extract the max-age value
            let exp = match cache_control_header.and_then(|cache_control| {
                let re = Regex::new(r"max-age=(\d+)").ok()?;
                re.captures(cache_control)
                    .and_then(|cap| cap.get(1)?.as_str().parse::<i64>().ok())
            }) {
                Some(v) => Some(
                    (Utc::now().naive_utc() + chrono::Duration::seconds(v))
                        .and_utc()
                        .timestamp() as usize,
                ),
                None => None,
            };

            let new_certs = match res.json::<GoogleCertsResponse>().await {
                Ok(v) => Ok(v),
                Err(_) => Err(AuthError::InternalError),
            }?;

            {
                let mut lock = google_certs.write().await;
                *lock = GoogleCerts {
                    certs: Some(new_certs.clone()),
                    exp,
                }
            }

            new_certs
        }
    };

    // verify jwt using google public jwk keys
    let header = match decode_header(&jwt) {
        Ok(v) => Ok(v),
        Err(_) => Err(AuthError::InternalError),
    }?;

    let jwk = match certs.keys.into_iter().find(|c| {
        c.kid
            == match &header.kid {
                Some(v) => v.to_string(),
                _ => "".to_string(),
            }
    }) {
        Some(v) => Ok(v),
        _ => Err(AuthError::InternalError),
    }?;

    let decoding_key = match DecodingKey::from_rsa_components(&jwk.n, &jwk.e) {
        Ok(v) => Ok(v),
        Err(_) => Err(AuthError::InternalError),
    }?;

    let google_token_aud = match env::var("GOOGLE_TOKEN_AUD") {
        Ok(v) => v.to_string(),
        Err(_) => format!("Error loading env variable"),
    };

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&[google_token_aud]);
    validation.set_required_spec_claims(&["exp", "sub", "aud"]);

    let decoded_token = match decode::<GoogleClaims>(&jwt, &decoding_key, &validation) {
        Ok(v) => Ok(v),
        Err(_) => Err(AuthError::InternalError),
    }?;

    // attempt to use email to get user from db
    let user = match app_state
        .db
        .get_user_by_email(&decoded_token.claims.email)
        .await
    {
        Ok(res) => match res {
            Some(v) => Ok(v),
            None => {
                // if the user does not exist, create it with a random password
                let payload = RegisterUserPayload {
                    email: decoded_token.claims.email.clone(),
                    pass: generate_password(20),
                    given_name: decoded_token.claims.given_name,
                    family_name: decoded_token.claims.family_name,
                };

                match app_state.db.create_user(payload).await {
                    Ok(v) => match v {
                        Some(v) => Ok(v),
                        None => return Err(AuthError::InternalError),
                    },
                    Err(_) => Err(AuthError::InternalError),
                }
            }
        },
        Err(_) => Err(AuthError::InternalError),
    }?;

    let hmac_key = match env::var("HMAC_KEY") {
        Ok(v) => v,
        Err(_) => panic!("Error loading HMAC_KEY. Ensure HMAC_KEY env var is set"),
    };

    let access_keys = Keys::new(hmac_key.as_bytes());
    let refresh_keys = Keys::new(hmac_key.as_bytes());

    // create tokens
    let access_claims = AccessClaims::new(&user.id.to_string(), &decoded_token.claims.email);
    let refresh_claims = RefreshClaims::new(&user.id.to_string(), None);

    let access_token = access_claims
        .build_token(access_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    let refresh_token = refresh_claims
        .build_token(refresh_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    // save token jtis to db
    let access_token_db = TokenDB::new(user.id, access_claims.jti, access_claims.exp);
    let refresh_token_db = TokenDB::new(user.id, refresh_claims.jti, refresh_claims.exp);
    let _ = app_state.db.create_token(access_token_db).await;
    let _ = app_state.db.create_token(refresh_token_db).await;

    // create cookies
    let access_cookie = Cookie::build(("access", access_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    let refresh_cookie = Cookie::build(("refresh", refresh_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    // add cookies to the jar
    Ok((StatusCode::OK, jar.add(access_cookie).add(refresh_cookie)))
}

pub async fn logout(
    State(app_state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<(StatusCode, PrivateCookieJar), AuthError> {
    let hmac_key = match env::var("HMAC_KEY") {
        Ok(v) => v,
        Err(_) => panic!("Error loading HMAC_KEY. Ensure HMAC_KEY env var is set"),
    };

    let access_keys = Keys::new(hmac_key.as_bytes());

    // extract tokens from cookies
    let access_token = match jar.get("access").map(|cookie| cookie.value().to_owned()) {
        Some(value) => value,
        None => String::from(""),
    };
    let refresh_token = match jar.get("refresh").map(|cookie| cookie.value().to_owned()) {
        Some(value) => value,
        None => String::from(""),
    };

    // decode access token
    let access_token_data = match decode::<AccessClaims>(
        &access_token,
        &access_keys.decoding,
        &Validation::default(),
    ) {
        Ok(token) => Ok(token),
        Err(err) => match err.kind() {
            // if token has expired decode anyway
            ErrorKind::ExpiredSignature => {
                let mut validation = Validation::default();
                validation.validate_exp = false; // Disable expiration validation

                let token_data =
                    decode::<AccessClaims>(&access_token, &access_keys.decoding, &validation)
                        .map_err(|_| AuthError::InvalidToken)?;

                Ok(token_data)
            }
            _ => Err(err),
        },
    }
    .map_err(|_| AuthError::InvalidToken)?;

    // blacklist all associated user tokens
    let _ = app_state
        .db
        .blacklist_user_tokens(
            ObjectId::parse_str(access_token_data.claims.sub)
                .expect("failed to parse string to ObjectId"),
        )
        .await;

    let exp = match OffsetDateTime::from_unix_timestamp(
        (Utc::now().naive_utc() - chrono::Duration::days(7))
            .and_utc()
            .timestamp(),
    ) {
        Ok(v) => Ok(v),
        Err(_) => Err(AuthError::InternalError),
    }
    .unwrap();

    // invalidate cookies
    let access_cookie = Cookie::build(("access", ""))
        .path("/")
        .expires(exp)
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    let refresh_cookie = Cookie::build(("refresh", ""))
        // .domain("localhost")
        .path("/")
        .expires(exp)
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    Ok((
        StatusCode::OK,
        jar.remove(access_token)
            .remove(refresh_token)
            .add(access_cookie)
            .add(refresh_cookie),
    ))
}

pub async fn register_user(
    State(app_state): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<RegisterUserPayload>,
) -> Result<(StatusCode, PrivateCookieJar), AuthError> {
    // create user account
    let new_user = match app_state.db.create_user(body).await {
        Ok(user) => match user {
            Some(u) => Ok(u),
            _ => Err(AuthError::InternalError),
        },
        Err(_) => Err(AuthError::InternalError),
    }?;

    // authenticate user
    let hmac_key = match env::var("HMAC_KEY") {
        Ok(v) => v,
        Err(_) => panic!("Error loading HMAC_KEY. Ensure HMAC_KEY env var is set"),
    };

    let access_keys = Keys::new(hmac_key.as_bytes());
    let refresh_keys = Keys::new(hmac_key.as_bytes());

    // create tokens
    let access_claims = AccessClaims::new(&new_user.id.to_string(), &new_user.email);
    let refresh_claims = RefreshClaims::new(&new_user.id.to_string(), None);

    let access_token = access_claims
        .build_token(access_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    let refresh_token = refresh_claims
        .build_token(refresh_keys.encoding)
        .map_err(|_| AuthError::InternalError)?;

    // save token jtis to db
    let access_token_db = TokenDB::new(new_user.id, access_claims.jti, access_claims.exp);
    let refresh_token_db = TokenDB::new(new_user.id, refresh_claims.jti, refresh_claims.exp);
    let _ = app_state.db.create_token(access_token_db).await;
    let _ = app_state.db.create_token(refresh_token_db).await;

    // create cookies
    let access_cookie = Cookie::build(("access", access_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    let refresh_cookie = Cookie::build(("refresh", refresh_token))
        // .domain("localhost")
        .path("/")
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .http_only(true);

    Ok((StatusCode::OK, jar.add(access_cookie).add(refresh_cookie)))
}

// todo:: update_password
// todo:: reset_password
