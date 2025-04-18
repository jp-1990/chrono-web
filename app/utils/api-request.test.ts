import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';

const { activities, reqQueue, requestQueue } = vi.hoisted(() => {
  return {
    activities: {
      find: vi.fn(),
      put: vi.fn(),
      add: vi.fn()
    },
    reqQueue: {
      enqueue: vi.fn(),
      dequeue: vi.fn()
    },
    requestQueue: {
      enqueue: vi.fn()
    }
  };
});

vi.mock('./indexeddb', () => ({
  db: {
    activities,
    reqQueue
  }
}));

vi.mock('./logging', () => ({
  logging: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('./request-queue', () => ({
  default: requestQueue
}));

import { apiRequest } from './api-request';

const navigatorMock = {
  onLine: false
};

vi.stubGlobal('navigator', navigatorMock);

const mockGetActivities = Object.assign(vi.fn(), {
  id: 'getActivities',
  dbReadHandlerPath: ['activities', 'find'] as const,
  dbWriteHandlerPath: ['activities', 'put'] as const
});

const mockPostActivity = Object.assign(vi.fn(), {
  id: 'postActivity',
  dbWriteHandlerPath: ['activities', 'add'] as const
});

describe('function apiRequest', () => {
  afterEach(() => {
    navigatorMock.onLine = false;
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  test('if online - the function should be called and the correct cache write function should be called', async () => {
    requestQueue.enqueue.mockImplementationOnce(() => {
      return {
        status: 200,
        ok: true,
        headers: {
          get(_: any) {
            return 'application/json';
          }
        },
        async json() {
          return { status: 'ok' };
        }
      };
    });

    navigatorMock.onLine = true;
    await apiRequest(mockPostActivity, 0, '1');

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(activities.add).toHaveBeenCalledTimes(1);
  });

  test('if online and read - the correct cache write function should be called', async () => {
    requestQueue.enqueue.mockImplementationOnce(() => {
      return {
        status: 200,
        ok: true,
        headers: {
          get(_: any) {
            return 'application/json';
          }
        },
        async json() {
          return { status: 'ok' };
        }
      };
    });

    navigatorMock.onLine = true;
    await apiRequest(mockGetActivities, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(activities.put).toHaveBeenCalledTimes(1);
  });

  test('if offline and read - the correct cache read function should be called', async () => {
    requestQueue.enqueue.mockImplementationOnce(() => {
      return {
        status: 200,
        ok: true,
        headers: {
          get(_: any) {
            return 'application/json';
          }
        },
        async json() {
          return { status: 'ok' };
        }
      };
    });

    await apiRequest(mockGetActivities, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(activities.find).toHaveBeenCalledTimes(1);
  });

  test('if offline and read or write - the request should be queued', async () => {
    requestQueue.enqueue.mockImplementationOnce(() => {
      return {
        status: 200,
        ok: true,
        headers: {
          get(_) {
            return 'application/json';
          }
        },
        async json() {
          return { status: 'ok' };
        }
      };
    });

    await apiRequest(mockGetActivities, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(activities.find).toHaveBeenCalledTimes(1);

    await apiRequest(mockPostActivity, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(2);
    expect(activities.add).toHaveBeenCalledTimes(1);
  });

  test('if offline and read or write - should return cached data', async () => {
    requestQueue.enqueue.mockImplementationOnce(() => {
      return {
        status: 200,
        ok: true,
        headers: {
          get(_) {
            return 'application/json';
          }
        },
        async json() {
          return { status: 'ok' };
        }
      };
    });

    activities.find.mockImplementationOnce(() => {
      return { cached: true };
    });

    const res = await apiRequest(mockGetActivities, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(activities.find).toHaveBeenCalledTimes(1);
    expect(res.data).toEqual({ cached: true });

    activities.add.mockImplementationOnce(() => {
      return { cached: true };
    });

    const res2 = await apiRequest(mockPostActivity, 0);

    expect(requestQueue.enqueue).toHaveBeenCalledTimes(2);
    expect(activities.add).toHaveBeenCalledTimes(1);
    expect(res2.data).toEqual({ cached: true });
  });
});
