import {
  type LoginArgs,
  type LoginRes,
  type PostLoginParams,
  type PostRegisterParams,
  type SignupArgs,
  type SignupRes,
  type User
} from '~/types/user';
import { type CredentialResponse } from 'vue3-google-signin';
import type { TypedResponse } from '~/types/api-request';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function postOAuth(credentialResponse: CredentialResponse) {
  const { credential } = credentialResponse;

  const url = new URL(`${API_URL}/v1/oauth`);
  const request = new Request(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'where?/api/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type',
      //   'Access-Control-Request-Headers': 'application/json'
      Authorization: `${credential}`
    }
  });

  const response: TypedResponse<User> = await fetch(request);
  return response;
}

export async function postLogin(params: PostLoginParams) {
  const url = new URL(`${API_URL}/v1/login`);
  const request = new Request(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'where?/api/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
    },
    body: JSON.stringify({
      email: params.email,
      pass: params.password
    })
  });

  const response: TypedResponse<User> = await fetch(request);
  return response;
}

export async function postLogout() {
  const url = new URL(`${API_URL}/v1/logout`);
  const request = new Request(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'where?/api/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
    }
  });

  const response = await fetch(request);
  return response;
}

export async function postRegister(params: PostRegisterParams) {
  const url = new URL(`${API_URL}/v1/register`);
  const request = new Request(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'where?/api/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
    },
    body: JSON.stringify({
      email: params.email,
      pass: params.password,
      givenName: params.givenName,
      familyName: params.familyName
    })
  });

  const response = await fetch(request);
  return response;
}

export const loginOld = async (user: LoginArgs): Promise<LoginRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
          mutation {
            signIn (
              email: "${user.email}",
              password: "${user.password}",
              ) {
                token
                tokenExpires
                user {
                  id
                  name
                  email
                  photo
                  role
                  active
                }
            }
          }
        `
    })
  });
  const { data } = await response.json();
  return data.signIn;
};

export const signupOld = async (user: SignupArgs): Promise<SignupRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
          mutation {
            registerUser (
              name: "${user.name}",
              email: "${user.email}",
              password: "${user.password}",
              passwordConfirm: "${user.confirmPassword}",
              ) 
          }
        `
    })
  });
  const { data } = await response.json();
  return data.registerUser;
};
