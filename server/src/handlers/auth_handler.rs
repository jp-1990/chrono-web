use std::usize;

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::{Extension, Json};
use axum_extra::extract::cookie::{Cookie, SameSite};
use axum_extra::extract::{CookieJar, PrivateCookieJar};
use axum_macros::debug_handler;
use chrono::Utc;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use mongodb::bson::oid::ObjectId;
use regex::Regex;
use reqwest::header::CACHE_CONTROL;
use time::OffsetDateTime;

use crate::error::error::AuthError;
use crate::models::auth_model::{
    AccessToken, AuthPayload, GoogleCertsResponse, GoogleClaims, RefreshToken, TokenDB,
};
use crate::models::state_model::GoogleCerts;
use crate::models::user_model::{RegisterUserPayload, UserResponse};
use crate::utils::utils::generate_password;
use crate::{AppState, GoogleCertsState};

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

#[debug_handler]
pub async fn authorize(
    State(app_state): State<AppState>,
    private_jar: PrivateCookieJar,
    public_jar: CookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<
    (
        PrivateCookieJar,
        CookieJar,
        (StatusCode, Json<UserResponse>),
    ),
    AuthError,
> {
    // Check if the user sent the credentials
    if body.email.is_empty() || body.pass.is_empty() {
        return Err(AuthError::MissingCredentials);
    }

    // fetch user
    let user = match app_state.db.get_user_by_email(&body.email).await {
        Ok(res) => match res {
            Some(v) => v,
            None => return Err(AuthError::WrongCredentials),
        },
        Err(_) => return Err(AuthError::InternalError),
    };

    // verify password
    match bcrypt::verify(&body.pass, &user.pass) {
        Ok(v) => {
            if v == false {
                return Err(AuthError::WrongCredentials);
            }
        }
        Err(_) => return Err(AuthError::InternalError),
    }

    // create tokens
    let access_token = AccessToken::new(&user.id.to_string())?;
    let refresh_token = RefreshToken::new(&user.id.to_string(), None)?;

    // save token jtis to db
    let _ = app_state
        .db
        .create_token(TokenDB::from(&access_token))
        .await;
    let _ = app_state
        .db
        .create_token(TokenDB::from(&refresh_token))
        .await;

    let user = match app_state.db.get_user_by_email(&body.email).await {
        Ok(user) => match user {
            Some(u) => Ok(u),
            None => Err(AuthError::InternalError),
        },
        Err(_) => Err(AuthError::InternalError),
    }?;

    // create cookies
    let refresh_check_cookie = Cookie::build(("refresh-check", "1"))
        // .domain("localhost")
        .path("/")
        .expires(OffsetDateTime::from_unix_timestamp(refresh_token.claims.exp as i64).unwrap())
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .build();

    Ok((
        private_jar
            .add(Cookie::from(&access_token))
            .add(Cookie::from(&refresh_token)),
        public_jar.add(refresh_check_cookie),
        (StatusCode::OK, Json(UserResponse::from(user))),
    ))
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
    private_jar: PrivateCookieJar,
    public_jar: CookieJar,
    headers: HeaderMap,
) -> Result<
    (
        PrivateCookieJar,
        CookieJar,
        (StatusCode, Json<UserResponse>),
    ),
    AuthError,
> {
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

    let google_certs_url: &String = &app_state.env.google_certs_urls.to_string();

    // get certs from app_state
    let certs = match (&certs_state.certs, &certs_state.exp) {
        (Some(certs), Some(exp)) if exp > &now_timestamp => certs.clone(),
        // if none or expired - fetch certs and save to app_state
        _ => {
            let res = match app_state.client.get(google_certs_url).send().await {
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

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&[&app_state.env.google_token_aud]);
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

    // create tokens
    let access_token = AccessToken::new(&user.id.to_string())?;
    let refresh_token = RefreshToken::new(&user.id.to_string(), None)?;

    // save token jtis to db
    let _ = app_state
        .db
        .create_token(TokenDB::from(&access_token))
        .await;
    let _ = app_state
        .db
        .create_token(TokenDB::from(&refresh_token))
        .await;

    let user = match app_state
        .db
        .get_user_by_email(&decoded_token.claims.email)
        .await
    {
        Ok(user) => match user {
            Some(u) => Ok(u),
            None => Err(AuthError::InternalError),
        },
        Err(_) => Err(AuthError::InternalError),
    }?;

    // create cookies
    let refresh_check_cookie = Cookie::build(("refresh-check", "1"))
        // .domain("localhost")
        .path("/")
        .expires(OffsetDateTime::from_unix_timestamp(refresh_token.claims.exp as i64).unwrap())
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .build();

    Ok((
        private_jar
            .add(Cookie::from(&access_token))
            .add(Cookie::from(&refresh_token)),
        public_jar.add(refresh_check_cookie),
        (StatusCode::OK, Json(UserResponse::from(user))),
    ))
}

pub async fn logout(
    State(app_state): State<AppState>,
    private_jar: PrivateCookieJar,
    public_jar: CookieJar,
) -> Result<(StatusCode, PrivateCookieJar, CookieJar), AuthError> {
    // extract tokens from cookies
    let refresh_token = RefreshToken::try_from(&private_jar)?;

    // blacklist all associated user tokens
    let _ = app_state
        .db
        .blacklist_user_tokens(
            ObjectId::parse_str(&refresh_token.claims.sub)
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

    let access_token = match AccessToken::try_from(&private_jar) {
        Ok(token) => Ok(Some(token)),
        Err(err) if err == AuthError::MissingToken => Ok(None),
        Err(err) => Err(err),
    }?;

    let mut updated_jar = private_jar;

    // invalidate cookies
    match access_token {
        Some(token) => {
            let mut invalid_access_cookie = Cookie::from(&token);
            invalid_access_cookie.set_value("");
            invalid_access_cookie.set_expires(exp);

            updated_jar = updated_jar.remove(Cookie::from(&token));
            updated_jar = updated_jar.add(invalid_access_cookie);
            ()
        }
        None => (),
    }

    let mut invalid_refresh_cookie = Cookie::from(&refresh_token);
    invalid_refresh_cookie.set_value("");
    invalid_refresh_cookie.set_expires(exp);

    updated_jar = updated_jar.remove(Cookie::from(&refresh_token));
    updated_jar = updated_jar.add(invalid_refresh_cookie);

    Ok((
        StatusCode::OK,
        updated_jar,
        public_jar.remove("refresh-check"),
    ))
}

#[debug_handler]
pub async fn register_user(
    State(app_state): State<AppState>,
    private_jar: PrivateCookieJar,
    public_jar: CookieJar,
    Json(body): Json<RegisterUserPayload>,
) -> Result<
    (
        PrivateCookieJar,
        CookieJar,
        (StatusCode, Json<UserResponse>),
    ),
    AuthError,
> {
    // create user account
    let new_user = match app_state.db.create_user(body).await {
        Ok(user) => match user {
            Some(u) => Ok(u),
            _ => Err(AuthError::InternalError),
        },
        Err(_) => Err(AuthError::InternalError),
    }?;

    // create tokens
    let access_token = AccessToken::new(&new_user.id.to_string())?;
    let refresh_token = RefreshToken::new(&new_user.id.to_string(), None)?;

    // save token jtis to db
    let _ = app_state
        .db
        .create_token(TokenDB::from(&access_token))
        .await;
    let _ = app_state
        .db
        .create_token(TokenDB::from(&refresh_token))
        .await;

    // create cookies
    let refresh_check_cookie = Cookie::build(("refresh-check", "1"))
        // .domain("localhost")
        .path("/")
        .expires(OffsetDateTime::from_unix_timestamp(refresh_token.claims.exp as i64).unwrap())
        .same_site(SameSite::Lax)
        .secure(false) // todo:: in prod = true
        .build();

    Ok((
        private_jar
            .add(Cookie::from(&access_token))
            .add(Cookie::from(&refresh_token)),
        public_jar.add(refresh_check_cookie),
        (StatusCode::OK, Json(UserResponse::from(new_user))),
    ))
}

// todo:: update_password
// todo:: reset_password
