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
  console.log('--------');
  console.log('STEP: start apirequest');
  console.log('writehandlers', writeHandlerToDBMap.keys());
  console.log('readhandlers', readHandlerToDBMap.keys());

  const output: ApiRequestResponse<T> = {
    data: undefined,
    status: undefined,
    error: undefined
  };

  const isMutation = /put|patch|post|delete/g.test(fn.name);

  console.log({ isMutation });

  let dbFn: Function | undefined = undefined;
  if (isMutation) dbFn = writeHandlerToDBMap.get(fn.name);
  if (/get/g.test(fn.name)) dbFn = readHandlerToDBMap.get(fn.name);

  console.log('fn/dbfn', fn.name, dbFn?.name);

  try {
    console.log('STEP: start try');
    let response: TypedResponse;
    if (navigator.onLine) {
      console.log('STEP: navigator.onLine === true');
      response = await fn(...args);
      output.status = response.status;

      // if mutation - perform action on cache
      if (isMutation) {
        if (dbFn) {
          logging.info(undefined, {
            message: 'ONLINE: writing mutation to cache',
            fn: fn.name
          });
          await dbFn(...(args as any));
        }
      }
    } else {
      console.log('STEP: navigator.onLine === false');
      // if offline use the cache
      let cachedData: any;
      if (dbFn) {
        logging.info(undefined, {
          message: 'OFFLINE: using cache',
          fn: fn.name
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
      throw new Error(`${fn.name} [status:${response.status}]`);
    }

    if (response.fromCache) {
      console.log('STEP: response from cache');
      output.data = response.data;
    } else {
      console.log('STEP: response from api');

      const contentType = response.headers.get('content-type');
      console.log({ contentType });
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        output.data = json;
      }

      // if get - update cache
      if (/get/g.test(fn.name) && output.data) {
        const cacheUpdater = writeHandlerToDBMap.get(fn.name);
        console.log('cacheupdater', cacheUpdater);
        if (cacheUpdater) {
          logging.info(undefined, {
            message: 'ONLINE: writing update to cache',
            fn: fn.name
          });
          cacheUpdater(output.data);
        }
      }
    }

    console.log('STEP: end apirequest: success');
    console.log('--------');
    return output;
  } catch (err: any) {
    console.log('error', err);

    const statusCode = parseInt(err.message.match(/status:(\d+)/)[1], 10);

    logging.error(
      { code: statusCode, message: err.message, stacktrace: err.stacktrace },
      {
        message: 'apiRequest error',
        fn: fn.name
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
    console.log('STEP: end apirequest: success');
    console.log('--------');
    return output;
  }
};
