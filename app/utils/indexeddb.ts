import { add } from 'date-fns';
import type { Activity } from '~/types/activity';
import type { TypedResponse } from '~/types/api-request';
import type { User } from '~/types/user';

const handlerNameToRequest = new Map();
handlerNameToRequest.set(postActivity.name, postActivity);
handlerNameToRequest.set(patchActivity.name, patchActivity);
handlerNameToRequest.set(deleteActivity.name, deleteActivity);

function prepareArgs(values: any) {
  const many = Array.isArray(values);
  const v = Array.isArray(values) ? values : [values];
  return { many, v };
}

const storeKeys = {
  activities: 'activities',
  users: 'users',
  reqQueue: 'reqQueue'
} as const;

type PendingRequest = {
  id: string;
  datetime: string;
  fnName: string;
  args: string;
  exp: string;
};

type StoreKeys = (typeof storeKeys)[keyof typeof storeKeys];

type StoreTypes = {
  activities: Activity;
  users: User;
  reqQueue: PendingRequest;
};

type StoreFilters = {
  activities: { start: string; end: string };
};

export class IndexedDB {
  readonly version = 1;
  #db: IDBDatabase | undefined;
  #storeKeys = storeKeys;

  activities = {
    add: async (values: Activity | Activity[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#add('activities', v);
      return many ? res : res[0];
    },
    put: async (values: Activity | Activity[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#put('activities', v);
      return many ? res : res[0];
    },
    delete: async (values: Pick<Activity, 'id'> | Pick<Activity, 'id'>[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#delete('activities', v);
      return many ? res : res[0];
    },
    findById: async (value: Pick<Activity, 'id'>) => {
      return await this.#findById('activities', value);
    },
    find: async (filters: StoreFilters['activities']) => {
      return new Promise<Activity[]>((res, rej) => {
        if (!this.#db) {
          console.error('Database not initialized');
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
    delete: async (values: Pick<User, 'id'> | Pick<User, 'id'>[]) => {
      const { v, many } = prepareArgs(values);
      const res = await this.#delete('users', v);
      return many ? res : res[0];
    },
    findById: async (value: Pick<User, 'id'>) => {
      return await this.#findById('users', value);
    }
  };

  reqQueue = {
    add: async <T extends (...args: Parameters<T>) => Promise<TypedResponse>>(
      fn: T,
      ...args: Parameters<T>
    ) => {
      const datetime = new Date().toISOString();
      const fnName = fn.name;
      const JSONArgs = JSON.stringify(args);
      const exp = add(new Date(), { hours: 24 }).toISOString();

      console.log(args, JSONArgs);
      return await this.#add(storeKeys.reqQueue, [
        {
          id: datetime,
          args: JSONArgs,
          datetime,
          fnName,
          exp
        }
      ]);
    },
    process: async () => {
      const pendingRequests = await new Promise<PendingRequest[]>(
        (res, rej) => {
          console.log('started processing request queue');
          if (!this.#db) {
            console.error('Database not initialized');
            return rej();
          }

          const transaction = this.#db.transaction(
            storeKeys.reqQueue,
            'readonly'
          );
          const store = transaction.objectStore(storeKeys.reqQueue);

          // Open a cursor on the index
          const cursorRequest = store.openCursor();

          const requests: PendingRequest[] = [];

          cursorRequest.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
              const request = cursor.value;
              console.log('request', request);

              if (!navigator.onLine) {
                rej('offline');
              }

              if (new Date().getTime() < new Date(request.exp).getTime()) {
                requests.push(request);
              }

              cursor.continue();
            } else {
              res(requests); // No more entries
            }
          };

          cursorRequest.onerror = (event: any) => {
            rej(event.target.request);
          };
        }
      );

      const success: { id: string }[] = [];
      const error: { id: string }[] = [];

      for (const request of pendingRequests) {
        try {
          await handlerNameToRequest.get(request.fnName)(
            ...JSON.parse(request.args)
          );
          success.push({ id: request.id });
        } catch (_err) {
          error.push({ id: request.id });
        }
      }

      console.log(pendingRequests);
      this.#delete(storeKeys.reqQueue, success);
      // todo: DLQ?
      this.#delete(storeKeys.reqQueue, error);
      console.log('finished processing request queue');
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

        request.onerror = (event) => {
          console.error('Failed to open CHRONO_DB', event);
          rej();
        };

        request.onsuccess = (event: any) => {
          console.log('IndexedDB db connected');
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
        console.error(`Database error: ${event.target.error?.message}`);
      };

      return this;
    } catch (err) {
      console.error(err);
      return this;
    }
  }

  async #add<T extends StoreKeys>(
    store: T,
    values: StoreTypes[T][]
  ): Promise<StoreTypes[T][]> {
    return new Promise<StoreTypes[T][]>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<StoreTypes[T]>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.add(v);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[add] onsuccess', event);
            res(v);
          };
        });
      });

      transaction.oncomplete = async (event) => {
        console.log('[add] Transaction complete', event);
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
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<StoreTypes[T]>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.put(v);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[put] onsuccess', event);
            res(v);
          };
        });
      });

      transaction.oncomplete = async (event) => {
        console.log('[put] Transaction complete', event);
        const results = await Promise.all(promises);
        res(results);
      };
    });
  }

  async #delete<T extends StoreKeys>(store: T, values: { id: string }[]) {
    return new Promise<string[]>((resolve, reject) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return reject();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<string>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.delete(v.id);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[delete] onsuccess', event);
            res(event.target.result);
          };
        });
      });

      transaction.oncomplete = async (event) => {
        console.log('[delete] Transaction complete', event);
        const results = await Promise.all(promises);
        resolve(results);
      };
    });
  }

  async #findById<T extends StoreKeys>(store: T, value: { id: string }) {
    return new Promise<Activity>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);

      const result = objectStore.get(value.id);

      result.onsuccess = (event: any) => {
        res(event.target.result);
      };

      result.onerror = (event: any) => {
        rej(event.target.error);
      };

      transaction.oncomplete = (event) => {
        console.log('[findById] Transaction complete', event);
      };
    });
  }
}
