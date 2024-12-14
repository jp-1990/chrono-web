import type {
  Activity,
  PostActivityPayload,
  PatchActivityPayload,
  DeleteActivityParams,
  GetActivitiesParams,
  PostActivityArgs,
  PatchActivityArgs
} from '~/types/activity';
import type { TypedResponse } from '~/types/api-request';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// todo:: access policies
// todo:: headers

export async function postActivity(args: PostActivityArgs) {
  let body = { ...args };
  delete body.id;
  delete body.createdAt;
  delete body.user;
  delete body.v;
  body = body as PostActivityPayload;

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
    body: JSON.stringify(body)
  });

  const response: TypedResponse<Activity> = await fetch(request);

  return response;
}
postActivity.name = 'postActivity';

export async function patchActivity(args: PatchActivityArgs) {
  let { id, ...body } = { ...args };
  delete body.createdAt;
  delete body.user;
  delete body.v;
  body = body as PatchActivityPayload;

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

  const response: TypedResponse<Pick<Activity, 'id'>> = await fetch(request);

  return response;
}

export async function getActivities(params: GetActivitiesParams) {
  const url = new URL(`${API_URL}/v1/activity`);

  for (const key of Object.keys(params)) {
    if (params[key]) url.searchParams.set(key, params[key]);
  }

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
