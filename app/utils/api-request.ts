import type { TypedResponse } from '~/types/api-request';
import {
  deleteActivity,
  getActivities,
  patchActivity,
  postActivity
} from './api-activity';
import { db } from '~/composables/state';
import { logging } from './logging';
import { navigateTo } from '#imports';

const readHandlerToDBMap = new Map();
readHandlerToDBMap.set(getActivities.id, db.activities.find);

const writeHandlerToDBMap = new Map();
// activities
writeHandlerToDBMap.set(getActivities.id, db.activities.put);
writeHandlerToDBMap.set(postActivity.id, db.activities.add);
writeHandlerToDBMap.set(patchActivity.id, db.activities.put);
writeHandlerToDBMap.set(deleteActivity.id, db.activities.delete);
// users
// todo: update user

/*
  request cache

  reqs:
  if offline & mutation - on request add to queue
    - id
    - datetime
    - fn.id
    - args
    - exp - 24h

  on connectivity established - drain queue safely:
    read queue
    check online status - if false return - else
    await call fn with args
    if error - DLQ
    delete message from queue

*/

type ApiRequestResponse<
  T extends (...args: Parameters<T>) => Promise<TypedResponse>
> = {
  data: Awaited<ReturnType<Awaited<ReturnType<T>>['json']>> | undefined;
  status: number | undefined;
  error: unknown;
};

export const apiRequest = async <
  T extends (...args: Parameters<T>) => Promise<TypedResponse>
>(
  fn: T,
  ...args: Parameters<T>
): Promise<ApiRequestResponse<T>> => {
  const output: ApiRequestResponse<T> = {
    data: undefined,
    status: undefined,
    error: undefined
  };

  const isMutation = /put|patch|post|delete/g.test(fn.id);

  let dbFn: Function | undefined = undefined;
  if (isMutation) dbFn = writeHandlerToDBMap.get(fn.id);
  if (/get/g.test(fn.id)) dbFn = readHandlerToDBMap.get(fn.id);

  try {
    let response: TypedResponse;
    if (navigator.onLine) {
      response = await fn(...args);
      output.status = response.status;

      // if mutation - perform action on cache
      if (isMutation) {
        if (dbFn) {
          logging.info(undefined, {
            message: 'ONLINE: writing mutation to cache',
            fn: fn.id
          });
          await dbFn(...(args as any));
        }
      }
    } else {
      // if offline use the cache
      let cachedData: any;
      if (dbFn) {
        logging.info(undefined, {
          message: 'OFFLINE: using cache',
          fn: fn.id
        });
        cachedData = await dbFn(...(args as any));
      }

      // if mutation - queue request
      if (isMutation) {
        db.reqQueue.add(fn, ...args);
      }

      response = {
        data: cachedData ?? undefined,
        status: 200,
        ok: true,
        fromCache: true
      } as TypedResponse;
    }

    if (!response.ok) {
      throw new Error(`${fn.id} [status:${response.status}]`);
    }

    if (response.fromCache) {
      output.data = response.data;
    } else {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        output.data = json;
      }

      // if get - update cache
      if (/get/g.test(fn.id) && output.data) {
        const cacheUpdater = writeHandlerToDBMap.get(fn.id);
        if (cacheUpdater) {
          logging.info(undefined, {
            message: 'ONLINE: writing update to cache',
            fn: fn.id
          });
          cacheUpdater(output.data);
        }
      }
    }

    return output;
  } catch (err: any) {
    const statusCode = parseInt(err.message.match(/status:(\d+)/)[1], 10);

    logging.error(
      { code: statusCode, message: err.message, stacktrace: err.stacktrace },
      {
        message: 'apiRequest error',
        fn: fn.id
      }
    );

    switch (statusCode) {
      case 401:
      case 403: {
        await navigateTo('/login');
      }
    }

    output.data = undefined;
    output.error = err;
    return output;
  }
};
