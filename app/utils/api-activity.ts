import type {
  Activity,
  PostActivityPayload,
  PatchActivityPayload,
  GetActivitiesParams,
  PostActivityArgs,
  PatchActivityArgs
} from '../types/activity';
import type {
  APIFunctionWithoutResourceId,
  APIFunctionWithResourceId,
  ResourceId,
  TypedResponse
} from '../types/api-request';

export const handlerIdToFunc = new Map<
  APIFunctionWithResourceId['id'],
  APIFunctionWithResourceId
>();
const API_URL = import.meta.env.VITE_API_BASE_URL;

// todo:: access policies
// todo:: headers

export const postActivity: APIFunctionWithResourceId<
  Activity,
  [PostActivityArgs]
> = Object.assign(
  async (id: ResourceId, args: PostActivityArgs) => {
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
        // 'Access-Control-Allow-Origin': `${API_URL}/v1`,
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const response: TypedResponse<Activity> = await fetch(request);
    return response;
  },
  {
    id: 'postActivity',
    dbWriteHandlerPath: ['activities', 'add'] as const
  }
);
handlerIdToFunc.set(postActivity.id, postActivity);

export const patchActivity: APIFunctionWithResourceId<
  Activity,
  [PatchActivityArgs]
> = Object.assign(
  async (id: ResourceId, args: PatchActivityArgs) => {
    let { ...body } = { ...args };
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
  },
  {
    id: 'patchActivity',
    dbWriteHandlerPath: ['activities', 'put'] as const
  }
);
handlerIdToFunc.set(patchActivity.id, patchActivity);

export const deleteActivity: APIFunctionWithResourceId<Pick<Activity, 'id'>> =
  Object.assign(
    async (id: ResourceId) => {
      const url = new URL(`${API_URL}/v1/activity/${id}`);
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

      const response: TypedResponse<Pick<Activity, 'id'>> = await fetch(
        request
      );

      return response;
    },
    {
      id: 'deleteActivity',
      dbWriteHandlerPath: ['activities', 'delete'] as const
    }
  );
handlerIdToFunc.set(deleteActivity.id, deleteActivity);

export const getActivities: APIFunctionWithoutResourceId<
  Activity[],
  [GetActivitiesParams]
> = Object.assign(
  async (params: GetActivitiesParams) => {
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
  },
  {
    id: 'getActivities',
    dbReadHandlerPath: ['activities', 'find'] as const,
    dbWriteHandlerPath: ['activities', 'put'] as const
  }
);
