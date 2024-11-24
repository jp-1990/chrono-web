import type {
  Activity,
  PostActivityPayload,
  PatchActivityPayload,
  DeleteActivityParams,
  GetActivitiesParams
} from '~/types/activity';
import type { TypedResponse } from '~/types/api-request';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// todo:: access policies
// todo:: headers

export async function postActivity(payload: PostActivityPayload) {
  const url = new URL(`${API_URL}/v1/activity`);
  const request = new Request(url, {
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

  const url = new URL(`${API_URL}/v1/activity/${id}`);
  const request = new Request(url, {
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

export async function deleteActivity(params: DeleteActivityParams) {
  const url = new URL(`${API_URL}/v1/activity/${params.id}`);
  const request = new Request(url, {
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

export async function getActivities(params: GetActivitiesParams) {
  const url = new URL(`${API_URL}/v1/activity`);

  url.searchParams.set('start', params.start);
  url.searchParams.set('end', params.end);

  // todo:: filters
  const request = new Request(url, {
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
