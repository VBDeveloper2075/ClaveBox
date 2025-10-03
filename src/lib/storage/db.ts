import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { VaultItem } from '../types';

interface VaultDB extends DBSchema {
  meta: {
    key: 'salt';
    value: { key: 'salt'; value: string }; // base64 salt
  };
  items: {
    key: string; // id
    value: VaultItem;
    indexes: { 'by-updatedAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null;

export function initDB() {
  if (!dbPromise) {
    // Bump a version to ensure index creation even si la store ya existía
    dbPromise = openDB<VaultDB>('clavebox', 2, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        } else {
          // Ensure index exists if the store was created in a previous version
          const store = tx.objectStore('items');
          let hasIndex = true;
          try {
            // will throw if index doesn't exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            (store as any).index('by-updatedAt');
          } catch {
            hasIndex = false;
          }
          if (!hasIndex) {
            store.createIndex('by-updatedAt', 'updatedAt');
          }
        }
      }
    });
  }
  return dbPromise;
}

export async function getSaltB64(): Promise<string | null> {
  const db = await initDB();
  const row = await db.get('meta', 'salt');
  return row?.value ?? null;
}

export async function setSaltB64(b64: string): Promise<void> {
  const db = await initDB();
  await db.put('meta', { key: 'salt', value: b64 });
}

export async function putItem(item: VaultItem): Promise<void> {
  const db = await initDB();
  await db.put('items', item);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('items', id);
}

export async function listItems(): Promise<VaultItem[]> {
  const db = await initDB();
  try {
    return await db.getAllFromIndex('items', 'by-updatedAt');
  } catch {
    // Fallback si el índice no existe por alguna razón
    return await db.getAll('items');
  }
}
