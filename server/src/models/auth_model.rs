use std::{env, usize};

use axum_extra::extract::cookie::{Cookie, SameSite};
use axum_extra::extract::PrivateCookieJar;
use chrono::Utc;
use jsonwebtoken::errors::ErrorKind;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::error::error::AuthError;
use crate::utils::auth::generate_jti;

#[derive(Debug, Deserialize)]
pub struct AuthPayload {
    pub email: String,
    pub pass: String,
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
pub struct AccessClaims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub jti: String,
}

impl AccessClaims {
    pub fn new(sub: &String) -> Self {
        // todo:: set true expiry time
        let iat = (Utc::now().naive_utc()).and_utc().timestamp() as usize;
        let exp = (Utc::now().naive_utc() + chrono::Duration::minutes(1))
            .and_utc()
            .timestamp() as usize;

        Self {
            jti: generate_jti(),
            sub: sub.to_string(),
            iat,
            exp,
        }
    }
}

pub struct AccessToken {
    pub token: String,
    pub claims: AccessClaims,
    pub expired: bool,
}

impl AccessToken {
    pub fn new(sub: &String) -> Result<Self, AuthError> {
        let claims = AccessClaims::new(sub);

        let hmac_key = match env::var("HMAC_KEY") {
            Ok(v) => v,
            Err(_) => return Err(AuthError::InternalError),
        };

        let keys = Keys::new(hmac_key.as_bytes());

        let token = match encode(&Header::default(), &claims, &keys.encoding) {
            Ok(token) => Ok(token),
            Err(_) => Err(AuthError::InternalError),
        }?;

        Ok(Self {
            token,
            claims,
            expired: false,
        })
    }
}

impl From<&AccessToken> for Cookie<'_> {
    fn from(value: &AccessToken) -> Self {
        let env = match env::var("ENVIRONMENT") {
            Ok(v) => v,
            Err(_) => "dev".to_string(),
        };

        let mut cookie = Cookie::build(("access", value.token.clone()))
            // .domain("localhost")
            .path("/")
            .expires(OffsetDateTime::from_unix_timestamp(value.claims.exp as i64).unwrap())
            .http_only(true);

        cookie = match env.as_str() {
            "dev" => cookie.same_site(SameSite::Lax).secure(false),
            "prod" => cookie.same_site(SameSite::None).secure(true),
            _ => cookie,
        };

        cookie.build()
    }
}

impl TryFrom<&PrivateCookieJar> for AccessToken {
    type Error = AuthError;

    fn try_from(jar: &PrivateCookieJar) -> Result<Self, AuthError> {
        let hmac_key = match env::var("HMAC_KEY") {
            Ok(v) => v,
            Err(_) => return Err(AuthError::InternalError),
        };

        let keys = Keys::new(hmac_key.as_bytes());

        let token = match jar.get("access").map(|cookie| cookie.value().to_owned()) {
            Some(value) => Ok(value),
            None => Err(AuthError::MissingToken),
        }?;

        // Decode the user data
        let (token_data, token_expired) =
            match decode::<AccessClaims>(&token, &keys.decoding, &Validation::default()) {
                Ok(token) => Ok((token, false)),
                Err(err) => match err.kind() {
                    // if token has expired decode anyway
                    ErrorKind::ExpiredSignature => {
                        let mut validation = Validation::default();
                        validation.validate_exp = false; // Disable expiration validation

                        let token_data =
                            decode::<AccessClaims>(&token, &keys.decoding, &validation)
                                .map_err(|_| AuthError::InvalidToken)?;

                        Ok((token_data, true))
                    }
                    _ => Err(AuthError::InvalidToken),
                },
            }?;

        Ok(Self {
            token,
            expired: token_expired,
            claims: AccessClaims {
                sub: token_data.claims.sub,
                exp: token_data.claims.exp,
                iat: token_data.claims.iat,
                jti: token_data.claims.jti,
            },
        })
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
    pub fn new(sub: &String, exp: Option<usize>) -> Self {
        // todo:: set true expiry time
        let iat = (Utc::now().naive_utc()).and_utc().timestamp() as usize;
        let exp = match exp {
            Some(v) => v,
            None => (Utc::now().naive_utc() + chrono::Duration::minutes(60))
                .and_utc()
                .timestamp() as usize,
        };

        Self {
            jti: generate_jti(),
            sub: sub.to_string(),
            iat,
            exp,
        }
    }
}

pub struct RefreshToken {
    pub token: String,
    pub claims: RefreshClaims,
}

impl RefreshToken {
    pub fn new(sub: &String, exp: Option<usize>) -> Result<Self, AuthError> {
        let claims = RefreshClaims::new(sub, exp);

        let hmac_key = match env::var("HMAC_KEY") {
            Ok(v) => v,
            Err(_) => return Err(AuthError::InternalError),
        };

        let keys = Keys::new(hmac_key.as_bytes());

        let token = match encode(&Header::default(), &claims, &keys.encoding) {
            Ok(token) => Ok(token),
            Err(_) => Err(AuthError::Forbidden),
        }?;

        Ok(Self { token, claims })
    }
}

impl From<&RefreshToken> for Cookie<'_> {
    fn from(value: &RefreshToken) -> Self {
        let env = match env::var("ENVIRONMENT") {
            Ok(v) => v,
            Err(_) => "dev".to_string(),
        };

        let mut cookie = Cookie::build(("refresh", value.token.clone()))
            // .domain("localhost")
            .path("/")
            .expires(OffsetDateTime::from_unix_timestamp(value.claims.exp as i64).unwrap())
            .http_only(true);

        cookie = match env.as_str() {
            "dev" => cookie.same_site(SameSite::Lax).secure(false),
            "prod" => cookie.same_site(SameSite::None).secure(true),
            _ => cookie,
        };

        cookie.build()
    }
}

impl TryFrom<&PrivateCookieJar> for RefreshToken {
    type Error = AuthError;

    fn try_from(jar: &PrivateCookieJar) -> Result<Self, AuthError> {
        let hmac_key = match env::var("HMAC_KEY") {
            Ok(v) => v,
            Err(_) => return Err(AuthError::InternalError),
        };

        let keys = Keys::new(hmac_key.as_bytes());

        let token = match jar.get("refresh").map(|cookie| cookie.value().to_owned()) {
            Some(value) => Ok(value),
            None => Err(AuthError::MissingToken),
        }?;

        // Decode the user data
        let token_data =
            match decode::<RefreshClaims>(&token, &keys.decoding, &Validation::default()) {
                Ok(token) => Ok(token),
                Err(_) => Err(AuthError::InvalidToken),
            }?;

        Ok(Self {
            token,
            claims: RefreshClaims {
                sub: token_data.claims.sub,
                exp: token_data.claims.exp,
                iat: token_data.claims.iat,
                jti: token_data.claims.jti,
            },
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenDB {
    id: ObjectId,
    uid: ObjectId,
    jti: String,
    exp: mongodb::bson::DateTime,
    pub black: bool,
}

impl TokenDB {
    pub fn new(uid: String, jti: String, exp: usize) -> Self {
        let timestamp: i64 = (exp * 1000)
            .try_into()
            .expect("Token::new failed. invalid timestamp");

        Self {
            id: ObjectId::new(),
            uid: ObjectId::parse_str(uid).expect(""),
            exp: mongodb::bson::DateTime::from_millis(timestamp),
            black: false,
            jti,
        }
    }
}

impl From<&AccessToken> for TokenDB {
    fn from(value: &AccessToken) -> Self {
        TokenDB::new(
            value.claims.sub.clone(),
            value.claims.jti.clone(),
            value.claims.exp,
        )
    }
}

impl From<&RefreshToken> for TokenDB {
    fn from(value: &RefreshToken) -> Self {
        TokenDB::new(
            value.claims.sub.clone(),
            value.claims.jti.clone(),
            value.claims.exp,
        )
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct GoogleCertsResponse {
    pub keys: Vec<GoogleCert>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GoogleCert {
    // pub alg: String,
    pub kid: String,
    pub n: String,
    pub e: String,
    // pub kty: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleClaims {
    pub iss: String,
    pub azp: String,
    pub aud: String,
    pub sub: String,
    pub email: String,
    pub email_verified: bool,
    pub nbf: usize,
    pub name: String,
    pub picture: String,
    pub given_name: String,
    pub family_name: String,
    pub iat: usize,
    pub exp: usize,
    pub jti: String,
}
