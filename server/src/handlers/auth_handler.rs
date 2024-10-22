use std::env;

use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::{Cookie, SameSite};
use axum_extra::extract::PrivateCookieJar;

use crate::error::error::AuthError;
use crate::models::auth_model::{AuthPayload, TokenDB};
use crate::utils::auth::{AccessClaims, Keys, RefreshClaims};
use crate::AppState;

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
    let user = match app_state.db.get_user_by_email(body).await {
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

// todo:: update_password
// todo:: reset_password
// todo:: register
