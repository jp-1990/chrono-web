import type { TypedResponse, APIRequest } from '../types/api-request';
import { logging } from './logging';
import { db, IndexedDB } from './indexeddb';
import requestQueue from './request-queue';
import { navigateTo } from '#imports';

function getDBfunction(
  db: IndexedDB,
  path: readonly [string, string] | undefined
) {
  if (!path) return undefined;
  return db[path[0]][path[1]] as Function;
}

export const apiRequest: APIRequest = async (fn, ...args) => {
  const output: Awaited<ReturnType<APIRequest>> = {
    data: undefined,
    status: undefined,
    error: undefined
  };

  const isWrite = /^(put|patch|post|delete)*$/g.test(fn.id);
  const isRead = /^(get).*$/g.test(fn.id);

  // determine read/write handlers based on fn arg
  let dbWriteFn: Function | undefined = undefined;
  let dbReadFn: Function | undefined = undefined;
  dbWriteFn = getDBfunction(db, fn.dbWriteHandlerPath);
  dbReadFn = getDBfunction(db, fn.dbReadHandlerPath);

  try {
    let response: TypedResponse;
    let data: any = undefined;
    if (navigator.onLine) {
      // if device is online, expect the request queue to immediate call the function
      response = (await requestQueue.enqueue(fn, ...args)) as TypedResponse;
      output.status = response.status;

      // if mutation - perform action on cache
      if (isWrite && dbWriteFn) {
        logging.info(undefined, {
          message: 'ONLINE: writing mutation to cache',
          fn: fn.id
        });
        await dbWriteFn(...(args as any));
      }
    } else {
      // otherwise, use the cache and expect the request to be queued
      let cachedData: any;
      logging.info(undefined, {
        message: 'OFFLINE: using cache',
        fn: fn.id
      });

      // get functions will have both a read and write handler
      // here we want to call the primary action (ie get = read)
      if (isWrite && dbWriteFn) {
        cachedData = await dbWriteFn(...args);
      }
      if (isRead && dbReadFn) {
        cachedData = await dbReadFn(...args);
      }

      requestQueue.enqueue(fn, ...args);

      data = cachedData ?? undefined;
      response = {
        status: 200,
        ok: true,
        fromCache: true
      } as TypedResponse;
    }

    if (!response.ok) {
      throw new Error(`${fn.id} [status:${response.status}]`);
    }

    if (response.fromCache) {
      // if the response is from the cache we are done
      output.data = data;
    } else {
      // if the response is from the server we must parse it and update the cache
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        output.data = json;
      }

      // if get - update cache
      if (isRead && output.data && dbWriteFn) {
        logging.info(undefined, {
          message: 'ONLINE: writing update to cache',
          fn: fn.id
        });
        dbWriteFn(output.data.id, output.data);
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

    // if the response returns an auth error code, eject the user to the login page
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
