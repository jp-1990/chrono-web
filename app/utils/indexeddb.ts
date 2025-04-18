import type { Activity } from '../types/activity';
import type { User } from '../types/user';
import { logging } from './logging';

function prepareArgs(values: any) {
  const many = Array.isArray(values);
  const v = many ? values : [values];
  return { many, v };
}

const storeKeys = {
  activities: 'activities',
  users: 'users',
  reqQueue: 'reqQueue'
} as const;

export type PendingRequest = {
  resourceId: string;
  httpMethod: 'get' | 'put' | 'patch' | 'post' | 'delete';
  timestamp: string;
  fnId: string;
  args: string;
  exp: number;
};

type RequestQueue = {
  id: 'request-queue';
  queue: PendingRequest[];
};

type StoreKeys = (typeof storeKeys)[keyof typeof storeKeys];

type StoreTypes = {
  activities: Activity;
  users: User;
  reqQueue: RequestQueue;
};

type StoreFilters = {
  activities: { start: string; end: string };
};

export class IndexedDB {
  readonly version = 1;
  #db: IDBDatabase | undefined;
  #storeKeys = storeKeys;

  activities = {
    add: async (
      _id: Activity['id'] | undefined,
      values:
        | (Activity & { color?: string })
        | (Activity & { color?: string })[]
    ) => {
      const { v, many } = prepareArgs(values);
      const [activities, user] = await Promise.all([
        this.#add(storeKeys.activities, v),
        this.users.getAll()
      ]);

      if (!Array.isArray(user)) {
        for (const activity of v) {
          if (activity.color) {
            user.activities[activity.title] = activity.color;
          }
        }
        await this.users.put(user);
      }

      return many ? activities : activities[0];
    },
    put: async (
      _id: Activity['id'] | undefined,
      values:
        | (Activity & { color?: string })
        | (Activity & { color?: string })[]
    ) => {
      const { v, many } = prepareArgs(values);
      const [activities, user] = await Promise.all([
        this.#put(storeKeys.activities, v),
        this.users.getAll()
      ]);

      if (!Array.isArray(user)) {
        for (const activity of v) {
          if (activity.color) {
            user.activities[activity.title] = activity.color;
          }
        }
        await this.users.put(user);
      }
      return many ? activities : activities[0];
    },
    delete: async (values: Activity['id'] | Activity['id'][]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#delete(
        'activities',
        v.map((v) => v)
      );
      return many ? res : res[0];
    },
    findById: async (value: Pick<Activity, 'id'>) => {
      return await this.#findById('activities', value.id);
    },
    find: async (filters: StoreFilters['activities']) => {
      return new Promise<Activity[]>((res, rej) => {
        if (!this.#db) {
          logging.error({ message: 'IndexedDB Database not initialized' });
          return rej();
        }

        const transaction = this.#db.transaction(
          storeKeys.activities,
          'readonly'
        );
        const store = transaction.objectStore(storeKeys.activities);
        const index = store.index('start');
        const range = IDBKeyRange.upperBound(filters.end);
        const results: Activity[] = [];

        // Open a cursor on the index
        const cursorRequest = index.openCursor(range);

        cursorRequest.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            const activity = cursor.value;

            if (activity.end >= filters.start) {
              results.push(activity);
            }

            cursor.continue();
          } else {
            res(results); // No more entries
          }
        };

        cursorRequest.onerror = (event: any) => {
          rej(event.target.error);
        };
      });
    }
  };

  users = {
    add: async (values: User | User[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#add('users', v);
      return many ? res : res[0];
    },
    put: async (values: User | User[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#put('users', v);
      return many ? res : res[0];
    },
    delete: async (values: User['id'] | User['id'][]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#delete('users', v);
      return many ? res : res[0];
    },
    getAll: async () => {
      const res = await this.#getAll('users');
      return res.length > 1 ? res : res[0];
    },
    findById: async (value: User['id']) => {
      return await this.#findById('users', value);
    },
    refreshCheck: async () => {
      const res = await this.#getAll('users');
      return { id: res[0]?.id ?? '', refreshCheck: res[0]?._refreshCheck ?? 0 };
    }
  };

  reqQueue = {
    enqueue: async (requests: PendingRequest[]) => {
      let state = await this.#findById(storeKeys.reqQueue, 'request-queue');
      if (!state) state = { id: 'request-queue', queue: [] };

      state.queue.push(...requests);

      const result = await this.#put(storeKeys.reqQueue, [state]);
      return result[0].queue;
    },
    dequeue: async () => {
      const state = await this.#findById(storeKeys.reqQueue, 'request-queue');

      const result = state.queue.shift();

      await this.#put(storeKeys.reqQueue, [state]);
      return result;
    },
    clear: async () => {
      const state = await this.#findById(storeKeys.reqQueue, 'request-queue');
      state.queue = [];

      await this.#put(storeKeys.reqQueue, [state]);
      return undefined;
    }
  };

  constructor() {
    this.init = this.init.bind(this);

    // indexedDB.deleteDatabase('CHRONO_DB');
    return this;
  }

  async init() {
    if (this.#db) return this;

    try {
      const openedDB = new Promise<IDBDatabase>((res, rej) => {
        const request = window.indexedDB.open('CHRONO_DB', this.version);

        request.onerror = (_event) => {
          logging.error({ message: 'Failed to open CHRONO_DB' });
          rej();
        };

        request.onsuccess = (event: any) => {
          logging.info(undefined, { message: 'IndexedDB db connected' });
          // db instance
          res(event.target.result);
        };

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;

          // create activity store
          const activitiesStore = db.createObjectStore(
            this.#storeKeys.activities,
            {
              keyPath: 'id'
            }
          );

          activitiesStore.createIndex('start', 'start', { unique: false });
          activitiesStore.createIndex('end', 'end', { unique: false });

          // create users store
          db.createObjectStore(this.#storeKeys.users, {
            keyPath: 'id'
          });

          // create request cache store
          db.createObjectStore(this.#storeKeys.reqQueue, {
            keyPath: 'id'
          });
        };
      });

      this.#db = await openedDB;

      this.#db.onerror = (event: any) => {
        logging.error({
          message: `Database error: ${event.target.error?.message}`
        });
      };

      return this;
    } catch (err: any) {
      logging.error({
        message: err.message,
        stacktrace: err.stacktrace
      });
      return this;
    }
  }

  async #add<T extends StoreKeys>(
    store: T,
    values: StoreTypes[T][]
  ): Promise<StoreTypes[T][]> {
    return new Promise<StoreTypes[T][]>((res, rej) => {
      if (!this.#db) {
        logging.error({ message: 'IndexedDB Database not initialized' });
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<StoreTypes[T]>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.add(v);
          request.onsuccess = (event: any) => {
            logging.info(undefined, {
              message: '[indexedDB:add] success',
              id: event.target.result
            });
            res(v);
          };
        });
      });

      transaction.oncomplete = async (event: any) => {
        logging.info(undefined, {
          message: '[indexedDB:add] transaction complete',
          result: event.target.result
        });
        const results = await Promise.all(promises);
        res(results);
      };
    });
  }

  async #put<T extends StoreKeys>(
    store: T,
    values: StoreTypes[T][]
  ): Promise<StoreTypes[T][]> {
    return new Promise<StoreTypes[T][]>((res, rej) => {
      if (!this.#db) {
        logging.error({ message: 'IndexedDB Database not initialized' });
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<StoreTypes[T]>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.put(v);
          request.onsuccess = (event: any) => {
            logging.info(undefined, {
              message: '[indexedDB:put] success',
              id: event.target.result
            });
            res(v);
          };
        });
      });

      transaction.oncomplete = async (event: any) => {
        logging.info(undefined, {
          message: '[indexedDB:put] transaction complete',
          result: event.target.result
        });
        const results = await Promise.all(promises);
        res(results);
      };
    });
  }

  async #delete<T extends StoreKeys>(store: T, values: string[]) {
    return new Promise<string[]>((resolve, reject) => {
      if (!this.#db) {
        logging.error({ message: 'IndexedDB Database not initialized' });
        return reject();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<string>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.delete(v);
          request.onsuccess = (event: any) => {
            logging.info(undefined, {
              message: '[indexedDB:delete] success',
              id: event.target.result
            });
            res(event.target.result);
          };
        });
      });

      transaction.oncomplete = async (event: any) => {
        logging.info(undefined, {
          message: '[indexedDB:delete] transaction complete',
          result: event.target.result
        });
        const results = await Promise.all(promises);
        resolve(results);
      };
    });
  }

  async #findById<T extends StoreKeys>(store: T, id: string) {
    return new Promise<StoreTypes[T]>((res, rej) => {
      if (!this.#db) {
        logging.error({ message: 'IndexedDB Database not initialized' });
        return rej();
      }

      const transaction = this.#db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);

      const result = objectStore.get(id);

      result.onsuccess = (event: any) => {
        res(event.target.result);
      };

      result.onerror = (event: any) => {
        rej(event.target.error);
      };

      transaction.oncomplete = (event: any) => {
        logging.info(undefined, {
          message: '[indexedDB:findById] transaction complete',
          result: event.target.result
        });
      };
    });
  }

  async #getAll<T extends StoreKeys>(store: T) {
    return new Promise<StoreTypes[T][]>((res, rej) => {
      if (!this.#db) {
        logging.error({ message: 'IndexedDB Database not initialized' });
        return rej();
      }

      const transaction = this.#db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);

      const result = objectStore.getAll();

      result.onsuccess = (event: any) => {
        res(event.target.result);
      };

      result.onerror = (event: any) => {
        rej(event.target.error);
      };

      transaction.oncomplete = (event: any) => {
        logging.info(undefined, {
          message: '[indexedDB:getAll] transaction complete',
          result: event.target.result
        });
      };
    });
  }
}

export const db = await new IndexedDB().init();
