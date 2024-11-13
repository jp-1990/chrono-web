import type {
  Activity,
  PostActivityPayload,
  PatchActivityPayload,
  DeleteActivityPayload
} from '~/types/activity';
import type { TypedResponse } from '~/types/api-request';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// todo:: access policies
// todo:: headers

export async function postActivity(payload: PostActivityPayload) {
  const request = new Request(`${API_URL}/v1/activity`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'API_URL/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const response: TypedResponse<Activity> = await fetch(request);

  return response;
}

export async function patchActivity(payload: PatchActivityPayload) {
  const { id, ...body } = payload;

  const request = new Request(`${API_URL}/v1/activity/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'API_URL/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const response: TypedResponse<Activity> = await fetch(request);

  return response;
}

export async function deleteActivity(payload: DeleteActivityPayload) {
  const request = new Request(`${API_URL}/v1/activity/${payload.id}`, {
    method: 'DELETE',
    credentials: 'include'
    //   headers: {
    //     // 'Access-Control-Allow-Origin': 'API_URL/v1'
    //     'Content-Type': 'application/json',
    //     'access-control-request-headers': 'content-type'
    //     //   'Access-Control-Request-Headers': 'application/json'
    //   },
  });

  const response: TypedResponse<{ id: string }> = await fetch(request);

  return response;
}

export async function getActivities() {
  // todo:: filters
  const request = new Request(`${API_URL}/v1/activity`, {
    method: 'GET',
    credentials: 'include'
    // headers: {
    //   'Access-Control-Allow-Origin': 'API_URL/v1'
    //   'Content-Type': 'application/json',
    // }
  });

  const response: TypedResponse<Activity[]> = await fetch(request);

  return response;
}
