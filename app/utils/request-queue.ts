import { add } from 'date-fns';
import type {
  APIFunctionWithResourceId,
  ResourceId,
  TypedResponse
} from '../types/api-request';
import { db, type PendingRequest } from './indexeddb';
import { logging } from './logging';
import { handlerIdToFunc } from './api-activity';

/**
 *
 * We assume all api functions ids will be prefixed with the
 * http method they perform. Use this function to extract
 * the method from the function id.
 */
function parseHTTPMethodFromFnId(fnId: string) {
  const s = fnId.toLowerCase().match(/^get|post|put|patch|delete/gi)?.[0];

  switch (s) {
    case 'get':
    case 'post':
    case 'put':
    case 'patch':
    case 'delete':
      return s;
    default:
      return undefined;
  }
}

/**
 *
 * Create the PendingRequest type from an APIFunction that we will store in the request queue
 * - Each request has an expiry time of 24 hours
 * - The PendingRequest relies on the passed in function having an id
 * - The function with this id must exist in the function map passed into the request queue
 *
 * At call time, the args are parsed, and the function retrieved using its id. The function
 * is then called with the parsed args.
 */
const buildPendingRequest = <T extends APIFunctionWithResourceId>(
  fn: T,
  ...args: Parameters<T>
) => {
  const httpMethod = parseHTTPMethodFromFnId(fn.id);
  const timestamp = new Date().toISOString();
  const fnId = fn.id;
  const JSONArgs = JSON.stringify(args);
  const exp = add(new Date(), { hours: 24 }).getTime();

  if (!httpMethod) {
    return {
      resourceId: args[0],
      httpMethod: undefined,
      args: JSONArgs,
      timestamp,
      fnId,
      exp
    };
  }

  return {
    resourceId: args[0],
    httpMethod,
    args: JSONArgs,
    timestamp,
    fnId,
    exp
  };
};

// todo: improve logging - not enough info
/**
 *
 * Manages async requests.
 * All API requests should go through the request queue.
 *
 * Enqueue:
 * - When online, requests will be called immediately, unless they operate on a resource which has a request pending in the retry or dead letter queues. At which point the new request will be serialized as a PendingRequest and added to the respective queue.
 * - When offline, requests will serialized as PendingRequest types and added to the main queue, retry queue or dead letter queue based on the above logic.
 * - The retry and dead letter queues contain separate queues grouped by resource id.
 *
 * Drain:
 * - The queue can only be drained when the device is online (also applies to retry queue).
 * - During draining of the main queue, each queued request is called. If it returns 400 - 499 it is considered unrecoverable and added to the dead letter queue. If it returns 500 - 599 we assume network error, and add to the retry queue.
 * - The dead letter queue contains permanently failed requests and cannot be drained.
 *
 * The retry and dead letter queues are grouped by resource id to prevent chains of failure. For example if a post request returns a 500 we can assume it can be retried later. If this is followed by a put against the resource that would have been created by the previous failed request, this will also fail. Neither of these requests are sure to fail, so by adding them to the retry queue grouped by resource id, they can be retried later in sequence.
 */
export class RequestQueue {
  static #instance: RequestQueue | undefined = undefined;
  /**
   *
   * Stored functions by id. When draining queues, the function id in the PendingRequest will be used to retrieve the function to call from this map.
   */
  private fnMap:
    | Map<APIFunctionWithResourceId['id'], APIFunctionWithResourceId>
    | undefined = undefined;
  private retryQueueMap: Map<ResourceId, PendingRequest[]> = new Map();
  private DLQueueMap: Map<ResourceId, PendingRequest[]> = new Map();
  private tempIdToResourceIdMap: Map<string, ResourceId> = new Map();

  constructor(
    fnMap?: Map<APIFunctionWithResourceId['id'], APIFunctionWithResourceId>
  ) {
    this.fnMap ??= fnMap;

    if (RequestQueue.#instance) return RequestQueue.#instance;
    RequestQueue.#instance = this;
  }

  /**
   *
   * if online - call the function immediately (unless its resource id already exists in the retry or dead letter queues)
   * if offline - queue the request.
   */
  public enqueue = async <T extends APIFunctionWithResourceId>(
    fn: T,
    ...args: Parameters<T>
  ) => {
    const pendingRequest = buildPendingRequest(fn, ...args);
    if (!pendingRequest.httpMethod) throw new Error('invalid http method');

    if (pendingRequest.httpMethod !== 'get' && this.DLQueueMap.has(args[0])) {
      // if the request will operate on a resource that exists in the dead letter queue
      // add this request to the queue and return
      logging.info(undefined, {
        message: 'adding request to DLQ queue',
        fn: fn.id
      });
      if (!pendingRequest.httpMethod) return undefined;
      this.enqueueDLQueueById(args[0], pendingRequest);

      logging.info(undefined, {
        message: 'request added to DLQ queue',
        fn: fn.id
      });
      return undefined;
    }

    // if the request will operate on a resource that exists in the retry queue
    // add this request to the queue and return
    if (
      pendingRequest.httpMethod !== 'get' &&
      this.retryQueueMap.has(args[0])
    ) {
      logging.info(undefined, {
        message: 'queuing request in retry queue',
        fn: fn.id
      });
      if (!pendingRequest.httpMethod) return undefined;
      this.enqueueRetryQueueById(args[0], pendingRequest);

      logging.info(undefined, {
        message: 'request queued in retry queue',
        fn: fn.id
      });
      return undefined;
    }

    if (navigator.onLine) {
      try {
        logging.info(undefined, {
          message: 'running request',
          fn: fn.id
        });

        const res = await fn(args[0], ...args.slice(1));

        logging.info(undefined, {
          message: 'request complete',
          fn: fn.id
        });
        return res;
      } catch (e: any) {
        logging.error(e, { message: 'failed to run request', fn: fn.id });
        return {
          status: 500,
          ok: false,
          fromCache: false
        } as TypedResponse;
      }
    } else {
      try {
        logging.info(undefined, {
          message: 'queuing request',
          fn: fn.id
        });

        if (pendingRequest.httpMethod === 'get') {
          logging.info(undefined, {
            message: 'request method = get. skip queueing',
            fn: fn.id
          });
          return undefined;
        }

        const result = await db.reqQueue.enqueue([pendingRequest]);

        logging.info(undefined, { message: 'request queued', fn: fn.id });
        return result;
      } catch (e: any) {
        logging.error(e, { message: 'failed to queue request', fn: fn.id });
        return undefined;
      }
    }
  };

  /**
   *
   * Dequeue a request.
   * if offline - do nothing
   */
  public dequeue = async () => {
    if (!navigator.onLine) {
      logging.info(undefined, {
        message: 'cannot dequeue requests while offline'
      });
      return undefined;
    } else {
      try {
        const result = await db.reqQueue.dequeue();

        logging.info(undefined, {
          message: 'request dequeued',
          fn: result?.resourceId ?? 'undefined'
        });
        return result;
      } catch (e: any) {
        logging.error(e, { message: 'failed to dequeue request' });
        return undefined;
      }
    }
  };

  /**
   *
   * Drain the main queue.
   * if offline - do nothing
   *
   * Dequeues requests in sequence and calls them.
   * - 500 codes result in requests being added to the retry queue.
   * - 400 codes result in requests being added to the dead letter queue.
   * - if the request has expired it will not be called (exp time < now)
   */
  public drain = async () => {
    if (!navigator.onLine) {
      logging.info(undefined, {
        message: 'cannot drain queue while offline'
      });
      return undefined;
    } else {
      logging.info(undefined, { message: 'draining queue' });
      let done = false;
      while (!done) {
        const request = await this.dequeue();

        if (request === undefined) {
          done = true;
          break;
        }

        try {
          const fn = this.fnMap?.get(request.fnId);
          const args = JSON.parse(request.args);
          const exp = request.exp;

          if (!fn || exp < Date.now()) continue;

          // ensure subsequent requests against the same resource use the server side id
          if (
            /^(put|patch|delete)/g.test(fn.id) &&
            this.tempIdToResourceIdMap.has(args[0])
          ) {
            args[0] = this.tempIdToResourceIdMap.get(args[0]);
          }

          const res = await fn(args[0], ...args.slice(1));
          if (request.httpMethod === 'post' && res.headers) {
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const json = await res.json();
              if (json.id) {
                this.tempIdToResourceIdMap.set(args[0], json.id);
              }
            }
          }

          if (res.status >= 400 && res.status < 500) {
            this.enqueueDLQueueById(args[0], request);
          }

          if (res.status >= 500 && res.status < 600) {
            this.enqueueRetryQueueById(args[0], request);
          }

          logging.info(undefined, {
            message: 'request complete',
            fn: request.fnId
          });
        } catch (e: any) {
          logging.error(e, {
            message: 'failed to run request',
            fn: request.fnId
          });
        }
      }
      logging.info(undefined, { message: 'queue drained' });
      this.clear();
      return undefined;
    }
  };

  public clear = async () => {
    this.tempIdToResourceIdMap.clear();
    await db.reqQueue.clear();
  };

  public clearDLQ = async () => {
    this.DLQueueMap.clear();
  };

  public clearRetryQueue = async () => {
    this.retryQueueMap.clear();
  };

  private enqueueRetryQueueById = (id: string, request: PendingRequest) => {
    const retryQueue = this.retryQueueMap.get(id) ?? [];
    retryQueue.push(request);
    this.retryQueueMap.set(id, retryQueue);
  };

  public dequeueRetryQueueById = (id: string) => {
    const retryQueue = this.retryQueueMap.get(id) ?? [];
    const request = retryQueue.shift();
    if (retryQueue.length) {
      this.retryQueueMap.set(id, retryQueue);
    } else {
      this.retryQueueMap.delete(id);
    }
    return request;
  };

  public getRetryQueueById = (id: ResourceId) => {
    return this.retryQueueMap.get(id);
  };

  public getRetryQueue = () => {
    const output: { [k: ResourceId]: PendingRequest[] } = {};
    this.retryQueueMap.forEach((arr, k) => {
      output[k] = [...arr];
    });
    return output;
  };

  /**
   *
   * Drain a retry queue by resource id.
   * if offline - do nothing
   *
   * Dequeues requests in sequence and calls them.
   * - 400 or 500 codes are treated as unrecoverable at this point and the request is discarded.
   * - if a request is discarded, the rest of the queue is cleared for this resource id.
   * - if the request has expired it will not be called (exp time < now).
   */
  public drainRetryQueueById = async (id: string) => {
    if (!navigator.onLine) {
      logging.info(undefined, {
        message: 'cannot drain retry queue while offline'
      });
      return undefined;
    } else {
      logging.info(undefined, { message: 'draining retry queue' });
      let done = false;
      while (!done) {
        const request = this.dequeueRetryQueueById(id);

        if (request === undefined) {
          done = true;
          break;
        }

        try {
          const fn = this.fnMap?.get(request.fnId);
          const args = JSON.parse(request.args);
          const exp = request.exp;

          if (!fn || exp < Date.now()) continue;

          const res = await fn(args[0], ...args.slice(1));

          // treat as unrecoverable and clear all other requests against the same resource id
          if (res.status >= 400 && res.status < 600) {
            this.clearRetryQueueById(id);
            logging.info(undefined, {
              message: 'request failed',
              fn: request.fnId,
              status: res.status
            });
            done = true;
            break;
          }

          logging.info(undefined, {
            message: 'request complete',
            fn: request.fnId
          });
        } catch (e: any) {
          logging.error(e, {
            message: 'failed to run request',
            fn: request.fnId
          });
        }
      }
      logging.info(undefined, { message: 'retry queue drained' });
      return undefined;
    }
  };

  public clearRetryQueueById = (id: string) => {
    this.retryQueueMap.delete(id);
  };

  private enqueueDLQueueById = (id: string, request: PendingRequest) => {
    const DLQueue = this.DLQueueMap.get(id) ?? [];
    DLQueue.push(request);
    this.DLQueueMap.set(id, DLQueue);
  };

  public getDLQueueById = (id: ResourceId) => {
    return this.DLQueueMap.get(id);
  };

  public clearDLQueueById = (id: string) => {
    this.DLQueueMap.delete(id);
  };
}

const requestQueue = new RequestQueue(handlerIdToFunc);
export default requestQueue;
