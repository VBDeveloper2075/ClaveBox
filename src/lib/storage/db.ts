import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { VaultItem } from '../types';
import { u8ToB64, b64ToU8 } from '../crypto/crypto';

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

// --- Export / Import ---
type ExportedItem = Omit<VaultItem, 'ciphertext' | 'nonce'> & {
  ciphertextB64: string;
  nonceB64: string;
};

type VaultExport = {
  schemaVersion: 1;
  exportedAt: number;
  meta: { saltB64: string | null };
  items: ExportedItem[];
};

export async function exportVaultJSON(): Promise<string> {
  const db = await initDB();
  const items = await db.getAll('items');
  const salt = await getSaltB64();
  const payload: VaultExport = {
    schemaVersion: 1,
    exportedAt: Date.now(),
    meta: { saltB64: salt },
    items: items.map((it) => ({
      ...it,
      ciphertextB64: u8ToB64(it.ciphertext),
      nonceB64: u8ToB64(it.nonce)
    }))
  };
  // Remove binary fields from spread result
  for (const e of payload.items) {
    // @ts-ignore
    delete (e as any).ciphertext;
    // @ts-ignore
    delete (e as any).nonce;
  }
  return JSON.stringify(payload, null, 2);
}

async function clearAllItems(db: IDBPDatabase<VaultDB>) {
  await db.clear('items');
}

export async function importVaultJSON(jsonText: string, mode: 'merge' | 'replace' = 'merge') {
  const parsed = JSON.parse(jsonText) as VaultExport;
  if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.items)) {
    throw new Error('Archivo de importación inválido.');
  }
  const db = await initDB();
  if (mode === 'replace') {
    await clearAllItems(db);
  }
  let imported = 0;
  let skipped = 0;
  for (const e of parsed.items) {
    try {
      const item: VaultItem = {
        id: e.id,
        serviceName: e.serviceName,
        url: e.url,
        username: e.username,
        category: e.category,
        notes: e.notes,
        ciphertext: b64ToU8(e.ciphertextB64),
        nonce: b64ToU8(e.nonceB64),
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      };
      await db.put('items', item);
      imported++;
    } catch {
      skipped++;
    }
  }
  return { imported, skipped };
}
