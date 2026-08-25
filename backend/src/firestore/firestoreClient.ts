import { Firestore, Timestamp } from '@google-cloud/firestore';

/**
 * Memory-backed fallback database for local development and offline environments.
 * Prevents gRPC auth errors when Google Cloud credentials are not configured.
 */
class InMemoryDatabase {
  private store: Map<string, Map<string, any>> = new Map();

  private getCollection(colName: string) {
    if (!this.store.has(colName)) {
      this.store.set(colName, new Map());
    }
    return this.store.get(colName)!;
  }

  public collection(colName: string) {
    const self = this;
    const col = this.getCollection(colName);

    return {
      doc(docId: string) {
        return {
          async get() {
            const data = col.get(docId);
            return {
              id: docId,
              exists: !!data,
              data: () => data ? { ...data } : undefined,
            };
          },
          async set(data: any) {
            col.set(docId, { ...data });
            return { writeTime: new Date() };
          },
          async update(data: any) {
            const existing = col.get(docId) || {};
            col.set(docId, { ...existing, ...data });
            return { writeTime: new Date() };
          },
          async delete() {
            col.delete(docId);
            return { writeTime: new Date() };
          }
        };
      },

      async add(data: any) {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        col.set(id, { ...data, id });
        return {
          id,
          async get() {
            return { id, exists: true, data: () => ({ ...data, id }) };
          }
        };
      },

      where(field: string, op: string, value: any) {
        return this._buildQuery([{ field, op, value }], [], undefined);
      },

      orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
        return this._buildQuery([], [{ field, direction }], undefined);
      },

      limit(n: number) {
        return this._buildQuery([], [], n);
      },

      async get() {
        return this._buildQuery([], [], undefined).get();
      },

      _buildQuery(filters: Array<{ field: string; op: string; value: any }>, sorts: Array<{ field: string; direction: 'asc' | 'desc' }>, limitCount?: number) {
        return {
          where(field: string, op: string, value: any) {
            return self.collection(colName)._buildQuery([...filters, { field, op, value }], sorts, limitCount);
          },
          orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
            return self.collection(colName)._buildQuery(filters, [...sorts, { field, direction }], limitCount);
          },
          limit(n: number) {
            return self.collection(colName)._buildQuery(filters, sorts, n);
          },
          async get() {
            let items: any[] = [];
            col.forEach((data, id) => {
              items.push({ id, ...data });
            });

            // Apply filters
            for (const f of filters) {
              if (f.op === '==' || f.op === '===') {
                items = items.filter(item => item[f.field] === f.value);
              }
            }

            // Apply sorts
            for (const s of sorts) {
              items.sort((a, b) => {
                const va = a[s.field] instanceof Date ? a[s.field].getTime() : a[s.field];
                const vb = b[s.field] instanceof Date ? b[s.field].getTime() : b[s.field];
                if (va < vb) return s.direction === 'asc' ? -1 : 1;
                if (va > vb) return s.direction === 'asc' ? 1 : -1;
                return 0;
              });
            }

            if (typeof limitCount === 'number') {
              items = items.slice(0, limitCount);
            }

            return {
              empty: items.length === 0,
              size: items.length,
              forEach(callback: (doc: { id: string; data: () => any }) => void) {
                for (const item of items) {
                  callback({ id: item.id, data: () => item });
                }
              },
              docs: items.map(item => ({ id: item.id, data: () => item })),
            };
          }
        };
      }
    };
  }
}

// Check if credentials or Google Cloud project exists with credentials
const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.K_SERVICE;
let firestoreInstance: any;

if (hasGoogleCreds && process.env.GCP_PROJECT_ID) {
  try {
    firestoreInstance = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
    });
    console.log('[FirestoreClient]: Connected to Cloud Firestore');
  } catch (err: any) {
    console.warn('[FirestoreClient]: Cloud Firestore connection failed, using in-memory store:', err.message);
    firestoreInstance = new InMemoryDatabase();
  }
} else {
  console.log('[FirestoreClient]: Initialized in-memory store for local development session');
  firestoreInstance = new InMemoryDatabase();
}

export const db = firestoreInstance;
export default db;
