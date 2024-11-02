use axum::extract::FromRef;
use axum::RequestPartsExt;
use axum::{async_trait, extract::FromRequestParts, http::request::Parts};
use axum_extra::extract::cookie::{Cookie, Key};
use axum_extra::extract::PrivateCookieJar;
use mongodb::bson::oid::ObjectId;
use uuid::Uuid;

use crate::error::error::AuthError;
use crate::models::auth_model::{AccessClaims, AccessToken, RefreshToken, TokenDB};
use crate::AppState;

pub fn generate_jti() -> String {
    Uuid::new_v4().to_string()
}

#[async_trait]
impl<S> FromRequestParts<S> for AccessClaims
where
    S: Send + Sync,
    Key: FromRef<S>,
    AppState: FromRef<S>,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let jar = PrivateCookieJar::<Key>::from_request_parts(parts, &state)
            .await
            .map_err(|_| AuthError::InternalError)?;

        let state = parts
            .extract_with_state::<AppState, _>(state)
            .await
            .map_err(|_| AuthError::InternalError)?;

        // extract token from cookie and decode the user data
        let access_token = match AccessToken::try_from(&jar) {
            Ok(token) => Ok(Some(token)),
            Err(err) if err == AuthError::MissingToken => Ok(None),
            Err(err) => Err(err),
        }?;

        // check if access token is blacklisted
        match access_token {
            Some(token) if !token.expired => {
                match state.db.get_token(&token.claims.jti).await {
                    Ok(token) => match token {
                        Some(t) => {
                            if t.black {
                                Err(AuthError::Forbidden)
                            } else {
                                Ok(())
                            }
                        }
                        None => Ok(()),
                    },
                    _ => Err(AuthError::InternalError),
                }?;

                parts.extensions.insert(jar);

                Ok(token.claims)
            }
            _ => {
                // extract token from cookie
                let refresh_token = RefreshToken::try_from(&jar)?;

                // check refresh token has not been used before
                match state.db.get_token(&refresh_token.claims.jti).await {
                    Ok(token) => match token {
                        Some(t) => {
                            // if it has - revoke all associated tokens
                            if t.black {
                                let _ = state
                                    .db
                                    .blacklist_user_tokens(
                                        ObjectId::parse_str(&refresh_token.claims.sub)
                                            .expect("failed to parse string to ObjectId"),
                                    )
                                    .await;
                                Err(AuthError::Forbidden)
                            } else {
                                // if not - blacklist only the current refresh token
                                let _ = state
                                    .db
                                    .blacklist_user_token(&refresh_token.claims.jti)
                                    .await;
                                Ok(())
                            }
                        }
                        None => Err(AuthError::InvalidToken),
                    },
                    _ => Err(AuthError::InternalError),
                }?;

                // create new tokens
                let new_access_token = AccessToken::new(&refresh_token.claims.sub)?;
                let new_refresh_token =
                    RefreshToken::new(&refresh_token.claims.sub, Some(refresh_token.claims.exp))?;

                // save new token jtis to db
                let _ = state
                    .db
                    .create_token(TokenDB::from(&new_refresh_token))
                    .await;
                let _ = state
                    .db
                    .create_token(TokenDB::from(&new_access_token))
                    .await;

                // create cookies
                parts.extensions.insert::<PrivateCookieJar>(
                    jar.add(Cookie::from(&new_access_token))
                        .add(Cookie::from(&new_refresh_token)),
                );

                return Ok(new_access_token.claims);
            }
        }
    }
}
