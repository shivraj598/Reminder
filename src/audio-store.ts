const DB_NAME = "water-reminder";
const DB_VERSION = 1;
const STORE_NAME = "audio";
const AUDIO_KEY = "custom-sound";

export type StoredAudio = {
  blob: Blob;
  mimeType: string;
  fileName: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open audio database"));
  });
}

export async function saveAudio(
  blob: Blob,
  mimeType: string,
  fileName: string,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Failed to save reminder sound"));
    tx.objectStore(STORE_NAME).put({ blob, mimeType, fileName }, AUDIO_KEY);
  });
  db.close();
}

export async function getAudio(): Promise<StoredAudio | null> {
  const db = await openDb();
  const record = await new Promise<StoredAudio | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(AUDIO_KEY);
    request.onsuccess = () => {
      const value = request.result as StoredAudio | undefined;
      resolve(value?.blob ? value : null);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to load reminder sound"));
  });
  db.close();
  return record;
}

export async function clearAudio(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Failed to remove reminder sound"));
    tx.objectStore(STORE_NAME).delete(AUDIO_KEY);
  });
  db.close();
}
