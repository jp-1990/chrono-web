import type { Activity } from '~/types/activity';
import type { User } from '~/types/user';

const storeKeys = {
  activities: 'activities',
  users: 'users'
} as const;

type StoreKeys = (typeof storeKeys)[keyof typeof storeKeys];

type StoreTypes = {
  activities: Activity;
  users: User;
};

type StoreFilters = {
  activities: { start: string; end: string };
  users: {};
};

export class IndexedDB {
  readonly version = 1;
  #db: IDBDatabase | undefined;
  #storeKeys = storeKeys;

  activities = {
    add: async (values: Activity[]) => {
      return await this.#add('activities', values);
    },
    put: async (values: Activity[]) => {
      return await this.#put('activities', values);
    },
    delete: async (values: Activity['id'][]) => {
      return await this.#delete('activities', values);
    },
    findById: async (id: Activity['id']) => {
      return await this.#findById('activities', id);
    },
    find: async (filters: StoreFilters['activities']) => {
      return new Promise((res, rej) => {
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
    add: async (values: User[]) => {
      return await this.#add('users', values);
    },
    put: async (values: User[]) => {
      return await this.#put('users', values);
    },
    delete: async (values: User['id'][]) => {
      return await this.#delete('users', values);
    },
    findById: async (id: User['id']) => {
      return await this.#findById('users', id);
    }
  };

  constructor() {
    this.init = this.init.bind(this);
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
          console.log('IndexedDB connected');
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

  async #add<T extends StoreKeys>(store: T, values: StoreTypes[T][]) {
    return new Promise<Promise<string>[]>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<string>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.add(v);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[add] onsuccess', event);
            res(event.target.result);
          };
        });
      });

      transaction.oncomplete = (event) => {
        console.log('[add] Transaction complete', event);
        res(promises);
      };
    });
  }

  async #put<T extends StoreKeys>(store: T, values: StoreTypes[T][]) {
    return new Promise<Promise<string>[]>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<string>[] = values.map((v) => {
        return new Promise((res) => {
          const request = objectStore.add(v);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[put] onsuccess', event);
            res(event.target.result);
          };
        });
      });

      transaction.oncomplete = (event) => {
        console.log('[put] Transaction complete', event);
        res(promises);
      };
    });
  }

  async #delete<T extends StoreKeys>(store: T, ids: string[]) {
    return new Promise<Promise<string>[]>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
        return rej();
      }

      const transaction = this.#db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const promises: Promise<string>[] = ids.map((v) => {
        return new Promise((res) => {
          const request = objectStore.delete(v);
          request.onsuccess = (event: any) => {
            // return the id of the inserted item
            console.log('[delete] onsuccess', event);
            res(event.target.result);
          };
        });
      });

      transaction.oncomplete = (event) => {
        console.log('[delete] Transaction complete', event);
        res(promises);
      };
    });
  }

  async #findById<T extends StoreKeys>(store: T, id: string) {
    return new Promise<Activity>((res, rej) => {
      if (!this.#db) {
        console.error('Database not initialized');
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

      transaction.oncomplete = (event) => {
        console.log('[findById] Transaction complete', event);
      };
    });
  }
}
