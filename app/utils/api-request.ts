import type { TypedResponse } from '~/types/api-request';

const readHandlerToDBMap = new Map();
readHandlerToDBMap.set(getActivities.name, db.activities.find);

const writeHandlerToDBMap = new Map();
// activities
writeHandlerToDBMap.set(getActivities.name, db.activities.put);
writeHandlerToDBMap.set(postActivity.name, db.activities.add);
writeHandlerToDBMap.set(patchActivity.name, db.activities.put);
writeHandlerToDBMap.set(deleteActivity.name, db.activities.delete);
// users
// todo: update user

/*
  request cache

  reqs:
  if offline & mutation - on request add to queue
    - id
    - datetime
    - fn.name
    - args
    - exp - 24h

  on connectivity established - drain queue safely:
    read queue
    check online status - if false return - else
    await call fn with args
    if error - DLQ
    delete message from queue

*/

export const apiRequest = async <
  T extends (...args: Parameters<T>) => Promise<TypedResponse>
>(
  fn: T,
  ...args: Parameters<T>
) => {
  const output: {
    data: Awaited<ReturnType<Awaited<ReturnType<T>>['json']>> | undefined;
    status: number | undefined;
    error: unknown;
  } = {
    data: undefined,
    status: undefined,
    error: undefined
  };

  const isMutation = /put|patch|post|delete/g.test(fn.name);

  let dbFn: Function | undefined = undefined;
  if (isMutation) dbFn = writeHandlerToDBMap.get(fn.name);
  if (/get/g.test(fn.name)) dbFn = readHandlerToDBMap.get(fn.name);

  try {
    let response: TypedResponse;
    if (navigator.onLine) {
      response = await fn(...args);
      output.status = response.status;

      // if mutation - perform action on cache
      if (isMutation) {
        if (!dbFn) return;
        console.log('ONLINE: writing mutation to cache', fn.name);
        dbFn(...(args as any));
      }
    } else {
      // if offline use the cache
      if (!dbFn) return;

      console.log('OFFLINE: using cache', fn.name);
      const cachedActivities = await dbFn(...(args as any));

      // if mutation - queue request
      if (isMutation) {
        db.reqQueue.add(fn, ...args);
      }

      response = {
        data: cachedActivities,
        status: 200,
        ok: true,
        fromCache: true
      } as TypedResponse;
    }

    if (!response.ok) {
      throw new Error(`${fn.name} [status:${response.status}]`);
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
      if (/get/g.test(fn.name) && output.data) {
        const cacheUpdater = writeHandlerToDBMap.get(fn.name);
        if (!cacheUpdater) return;
        console.log('ONLINE: writing update to cache', fn.name);
        cacheUpdater(output.data);
      }
    }

    return output;
  } catch (err: any) {
    // todo:: do something with this
    console.log('err', err);
    const statusCode = parseInt(err.message.match(/status:(\d+)/)[1], 10);

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
