import {
  type PostLoginParams,
  type PostRegisterParams,
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
