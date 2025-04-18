import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('./indexeddb', () => ({
  db: {
    reqQueue: {
      enqueue: vi.fn((requests: PendingRequest[]) => {
        mockQueue.push(...requests);
        return mockQueue;
      }),
      dequeue: vi.fn(() => {
        return mockQueue.shift();
      }),
      clear: vi.fn(() => {
        mockQueue = [];
        return undefined;
      })
    }
  }
}));

vi.mock('./logging', () => ({
  logging: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('./api-activity', () => {
  return {
    handlerIdToFunc: new Map()
  };
});

import { type APIFunctionWithResourceId } from '../types/api-request';
import { RequestQueue } from './request-queue';
import type { PendingRequest } from './indexeddb';
import { logging } from './logging';
import { db } from './indexeddb';
import { handlerIdToFunc } from './api-activity';

const navigatorMock = {
  onLine: false
};

vi.stubGlobal('navigator', navigatorMock);

let mockQueue: PendingRequest[] = [];

const mockGet: any = vi.fn((n: number) => n);
const mockPost: any = vi.fn((n: number) => ({
  headers: {
    get(_args: any) {
      return 'application/json';
    }
  },
  json: async () => {
    return {
      id: n * 10
    };
  },
  status: 200,
  ok: true,
  fromCache: false
}));
const mockPatch: any = vi.fn((n: number) => n);
const mockDelete: any = vi.fn((n: number) => n);
mockGet.id = 'get';
mockPost.id = 'post';
mockPatch.id = 'patch';
mockDelete.id = 'delete';

const mockFnMap = new Map<
  APIFunctionWithResourceId['id'],
  APIFunctionWithResourceId
>();
mockFnMap.set(mockGet.id, mockGet);
mockFnMap.set(mockPost.id, mockPost);
mockFnMap.set(mockPatch.id, mockPatch);
mockFnMap.set(mockDelete.id, mockDelete);
handlerIdToFunc.set(mockGet.id, mockGet);
handlerIdToFunc.set(mockPost.id, mockPost);
handlerIdToFunc.set(mockPatch.id, mockPatch);
handlerIdToFunc.set(mockDelete.id, mockDelete);

describe('class RequestQueue', () => {
  afterEach(() => {
    navigatorMock.onLine = false;
    mockQueue = [];
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  test('class is singleton', () => {
    const a = new RequestQueue(mockFnMap);
    const b = new RequestQueue(mockFnMap);

    expect(a).toEqual(b);
  });

  describe('method: enqueue', () => {
    test('success [online]', async () => {
      navigatorMock.onLine = true;
      const queue = new RequestQueue(mockFnMap);

      const args = [0, '1'];
      const result = await queue.enqueue(mockGet, ...args);

      expect(result).toBe(0);
      expect(mockGet).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith(...args);

      expect(logging.info).toHaveBeenCalledTimes(2);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });

    test('success [offline]', async () => {
      const queue = new RequestQueue(mockFnMap);

      const args = [0, '1'];
      const result = (await queue.enqueue(
        mockPost,
        ...args
      )) as PendingRequest[];

      expect(result?.length).toEqual(1);
      expect(result?.[0].resourceId).toEqual(args[0]);
      expect(result?.[0].args).toEqual(JSON.stringify(args));
      expect(result?.[0].fnId).toEqual(mockPost.id);

      expect(mockPost).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(2);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });

    test('failure [offline] (error)', async () => {
      const queue = new RequestQueue(mockFnMap);
      (db.reqQueue.enqueue as any).mockImplementationOnce(() => {
        throw new Error();
      });

      const args = [0, '1'];
      const result = await queue.enqueue(mockPost, ...args);

      expect(mockPost).toHaveBeenCalledTimes(0);
      expect(logging.error).toHaveBeenCalledTimes(1);
      expect(result).toBe(undefined);
    });

    test('skips queueing GET requests', async () => {
      const queue = new RequestQueue(mockFnMap);

      const args = [0, '1'];
      const result = await queue.enqueue(mockGet, ...args);

      expect(result).toBe(undefined);
      expect(mockGet).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(2);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });

    test('retry: skips queueing requests in the main queue where a resourceId match exists in the retry queue', async () => {
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const argsA = ['0', '1'];
      const argsB = ['0', '2'];
      await queue.enqueue(mockPost, ...argsA);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      const result = await queue.enqueue(mockPatch, ...argsB);

      expect(result).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(9);
      expect(logging.error).toHaveBeenCalledTimes(0);

      queue.clearRetryQueueById('0');
    });

    test('retry: queues requests in the retry queue where a resourceId match exists in the retry queue', async () => {
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const argsA = ['0', '1'];
      const argsB = ['0', '2'];
      await queue.enqueue(mockPost, ...argsA);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      const result = await queue.enqueue(mockPatch, ...argsB);

      expect(result).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(9);
      expect(logging.error).toHaveBeenCalledTimes(0);

      const retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);

      queue.clearRetryQueueById('0');
    });

    test('DLQ: skips queueing requests in the main queue where a resourceId match exists in the dead letter queue', async () => {
      const queue = new RequestQueue(mockFnMap);
      queue.clearDLQueueById('0');

      const argsA = ['0', '1'];
      const argsB = ['0', '2'];
      await queue.enqueue(mockPost, ...argsA);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      const result = await queue.enqueue(mockPatch, ...argsB);

      expect(result).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(9);
      expect(logging.error).toHaveBeenCalledTimes(0);

      queue.clearDLQueueById('0');
    });

    test('DLQ: queues requests in the dead letter queue where a resourceId match exists in the dead letter queue', async () => {
      const queue = new RequestQueue(mockFnMap);
      queue.clearDLQueueById('0');

      const argsA = ['0', '1'];
      const argsB = ['0', '2'];
      await queue.enqueue(mockPost, ...argsA);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      const result = await queue.enqueue(mockPatch, ...argsB);

      expect(result).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(logging.info).toHaveBeenCalledTimes(9);
      expect(logging.error).toHaveBeenCalledTimes(0);

      const DLQueueByResourceId = queue.getDLQueueById('0');
      expect(DLQueueByResourceId?.length).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);

      queue.clearDLQueueById('0');
    });
  });

  describe('method: dequeue', () => {
    test('success [online]', async () => {
      const queue = new RequestQueue(mockFnMap);

      const args = [0, '1'];
      await queue.enqueue(mockPost, ...args);

      navigatorMock.onLine = true;
      const result = await queue.dequeue();

      expect(result?.resourceId).toEqual(args[0]);
      expect(result?.args).toEqual(JSON.stringify(args));
      expect(result?.fnId).toEqual(mockPost.id);

      expect(logging.info).toHaveBeenCalledTimes(3);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });

    test('failure [online] (error)', async () => {
      navigatorMock.onLine = true;
      const queue = new RequestQueue(mockFnMap);
      (db.reqQueue.dequeue as any).mockImplementationOnce(() => {
        throw new Error();
      });

      const args = [0, '1'];
      await queue.enqueue(mockPost, ...args);

      const result = await queue.dequeue();

      expect(logging.error).toHaveBeenCalledTimes(1);
      expect(result).toBe(undefined);
    });

    test('failure [offline]', async () => {
      const queue = new RequestQueue(mockFnMap);

      const args = [0, '1'];
      await queue.enqueue(mockPost, ...args);

      const result = await queue.dequeue();

      expect(result).toBe(undefined);

      expect(logging.info).toHaveBeenCalledTimes(3);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('method: drain', async () => {
    test('success', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);

      // queue some requests
      const tempId = 1;
      await queue.enqueue(mockPost, tempId as any);
      await queue.enqueue(mockPatch, tempId as any);
      await queue.enqueue(mockDelete, tempId as any);

      expect(mockPost).toHaveBeenCalledTimes(0);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(mockDelete).toHaveBeenCalledTimes(0);

      // drain
      navigatorMock.onLine = true;
      await queue.drain();

      const trueId = tempId * 10;
      expect(mockPost).toHaveBeenCalledWith(tempId);
      expect(mockPatch).toHaveBeenCalledWith(trueId);
      expect(mockDelete).toHaveBeenCalledWith(trueId);
    });

    test('request failure - 400', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearDLQueueById('0');

      const args = ['0', '1'];
      await queue.enqueue(mockPost, ...args);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      const DLQueueByResourceId = queue.getDLQueueById('0');
      expect(DLQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);

      queue.clearDLQueueById('0');
    });

    test('request failure - 500', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      await queue.enqueue(mockPost, ...args);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      const retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);

      queue.clearRetryQueueById('0');
    });
  });

  describe('method: drainRetryQueueById', () => {
    test('successfully drains retry queue by id (single) [online]', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      await queue.enqueue(mockPost, ...args);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);

      navigatorMock.onLine = true;
      await queue.drainRetryQueueById('0');

      retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    test('successfully drains retry queue by id (multi) [online]', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      const args2 = ['0', '2'];
      await queue.enqueue(mockPost, ...args);
      await queue.enqueue(mockPatch, ...args2);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });
      mockPatch.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(1);

      navigatorMock.onLine = true;
      await queue.drainRetryQueueById('0');

      retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPatch).toHaveBeenCalledTimes(2);
    });

    test('noop [offline]', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      await queue.enqueue(mockPost, ...args);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);

      navigatorMock.onLine = false;
      await queue.drainRetryQueueById('0');

      retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });

    test('clears retry queue when a request fails [online]', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      const args2 = ['0', '2'];
      await queue.enqueue(mockPost, ...args);
      await queue.enqueue(mockPatch, ...args2);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });
      mockPatch.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(1);

      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });

      navigatorMock.onLine = true;
      await queue.drainRetryQueueById('0');

      retryQueueByResourceId = queue.getRetryQueueById('0');
      expect(retryQueueByResourceId?.length).toBe(undefined);
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('method: clear', () => {
    test('clears the main request queue', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      const args2 = ['1', '2'];
      const args3 = ['2', '3'];
      await queue.enqueue(mockPost, ...args);
      await queue.enqueue(mockPatch, ...args2);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });
      mockPatch.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      let dlQueueByResourceId = queue.getDLQueueById('1');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(dlQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      await queue.enqueue(mockPatch, ...args3);
      expect(mockQueue.length).toBe(1);

      await queue.clear();
      retryQueueByResourceId = queue.getRetryQueueById('0');
      dlQueueByResourceId = queue.getDLQueueById('1');

      expect(mockQueue.length).toBe(0);
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(dlQueueByResourceId?.length).toBe(1);
    });
  });

  describe('method: clearDLQ', () => {
    test('clears the dead letter queue', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      const args2 = ['1', '2'];
      const args3 = ['2', '3'];
      await queue.enqueue(mockPost, ...args);
      await queue.enqueue(mockPatch, ...args2);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });
      mockPatch.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      let dlQueueByResourceId = queue.getDLQueueById('1');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(dlQueueByResourceId?.length).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(0);
      expect(logging.error).toHaveBeenCalledTimes(0);

      await queue.enqueue(mockPatch, ...args3);
      expect(mockQueue.length).toBe(1);

      await queue.clearDLQ();
      retryQueueByResourceId = queue.getRetryQueueById('0');
      dlQueueByResourceId = queue.getDLQueueById('1');

      expect(mockQueue.length).toBe(1);
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(dlQueueByResourceId?.length).toBe(undefined);
    });
  });

  describe('method: clearRetryQueue', () => {
    test('clears the retry queue', async () => {
      navigatorMock.onLine = false;
      const queue = new RequestQueue(mockFnMap);
      queue.clearRetryQueueById('0');

      const args = ['0', '1'];
      const args2 = ['1', '2'];
      const args3 = ['2', '3'];
      await queue.enqueue(mockPost, ...args);
      await queue.enqueue(mockPatch, ...args2);
      mockPost.mockImplementationOnce(() => {
        return {
          status: 500
        };
      });
      mockPatch.mockImplementationOnce(() => {
        return {
          status: 400
        };
      });

      navigatorMock.onLine = true;
      await queue.drain();
      navigatorMock.onLine = false;

      let retryQueueByResourceId = queue.getRetryQueueById('0');
      let dlQueueByResourceId = queue.getDLQueueById('1');
      expect(retryQueueByResourceId?.length).toBe(1);
      expect(dlQueueByResourceId?.length).toBe(1);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(logging.error).toHaveBeenCalledTimes(0);

      await queue.enqueue(mockPatch, ...args3);
      expect(mockQueue.length).toBe(1);

      await queue.clearRetryQueue();
      retryQueueByResourceId = queue.getRetryQueueById('0');
      dlQueueByResourceId = queue.getDLQueueById('1');

      expect(mockQueue.length).toBe(1);
      expect(retryQueueByResourceId?.length).toBe(undefined);
      expect(dlQueueByResourceId?.length).toBe(1);
    });
  });
});
