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

export async function deleteActivity(payload: DeleteActivityPayload) {
  const url = new URL(`${API_URL}/v1/activity/${payload.id}`);
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

export type GetActivitiesParams = {
  start: [year: number, month: number, date: number];
  end: [year: number, month: number, date: number];
};

export async function getActivities({ start, end }: GetActivitiesParams) {
  const url = new URL(`${API_URL}/v1/activity`);

  url.searchParams.set(
    'start',
    new Date(buildLocalDatetime(...start)).toISOString()
  );
  url.searchParams.set(
    'end',
    new Date(buildLocalDatetime(...end, '23:59:59.999')).toISOString()
  );

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
