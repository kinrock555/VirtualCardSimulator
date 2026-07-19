import { generateRandomId } from './id';

/**
 * Minimal IndexedDB wrapper for user-uploaded playmat images. Images are
 * stored as raw Blobs (not base64 in localStorage) since even a couple of
 * photos would risk blowing localStorage's ~5-10MB quota - IndexedDB has no
 * such practical limit and is the right native tool for binary blobs. This
 * is the app's first use of IndexedDB (everything else stays in
 * localStorage, see lib/storage.ts); only playmat image bytes live here.
 */

const DB_NAME = 'vct-playmats';
const DB_VERSION = 1;
const STORE_NAME = 'playmats';

export const ALLOWED_PLAYMAT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_PLAYMAT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type CustomPlaymatMeta = {
  id: string;
  name: string;
  createdAt: string;
};

type CustomPlaymatRecord = CustomPlaymatMeta & { blob: Blob };

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

/** Validates format/size before anything is stored - PNG/JPEG/WebP only, capped at MAX_PLAYMAT_FILE_SIZE_BYTES. */
export function validatePlaymatFile(file: File): string | null {
  if (!ALLOWED_PLAYMAT_MIME_TYPES.includes(file.type as (typeof ALLOWED_PLAYMAT_MIME_TYPES)[number])) {
    return '対応していない画像形式です（PNG / JPG / JPEG / WebPのみ対応しています）。';
  }
  if (file.size > MAX_PLAYMAT_FILE_SIZE_BYTES) {
    return `ファイルサイズが大きすぎます（上限: ${Math.floor(MAX_PLAYMAT_FILE_SIZE_BYTES / (1024 * 1024))}MB）。`;
  }
  return null;
}

export async function addCustomPlaymat(file: File): Promise<CustomPlaymatMeta> {
  const validationError = validatePlaymatFile(file);
  if (validationError) throw new Error(validationError);

  const db = await openDb();
  const record: CustomPlaymatRecord = {
    id: generateRandomId('playmat'),
    name: file.name,
    createdAt: new Date().toISOString(),
    blob: file,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save the playmat image.'));
  });
  db.close();
  return { id: record.id, name: record.name, createdAt: record.createdAt };
}

export async function listCustomPlaymats(): Promise<CustomPlaymatMeta[]> {
  if (!isIndexedDbAvailable()) return [];
  const db = await openDb();
  const records = await new Promise<CustomPlaymatRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as CustomPlaymatRecord[]);
    request.onerror = () => reject(request.error ?? new Error('Failed to list playmats.'));
  });
  db.close();
  return records
    .map(({ id, name, createdAt }) => ({ id, name, createdAt }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCustomPlaymatBlob(id: string): Promise<Blob | undefined> {
  if (!isIndexedDbAvailable()) return undefined;
  const db = await openDb();
  const record = await new Promise<CustomPlaymatRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as CustomPlaymatRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error('Failed to load the playmat image.'));
  });
  db.close();
  return record?.blob;
}

export async function deleteCustomPlaymat(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete the playmat image.'));
  });
  db.close();
}
