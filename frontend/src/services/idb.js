// IndexedDB-backed cache for downloaded audio blobs.
// localStorage stays for tiny metadata/state; IndexedDB holds the big blobs.

const DB_NAME = 'mellow';
const DB_VERSION = 1;
const AUDIO = 'audio';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function withStore(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(AUDIO, mode);
        const store = tx.objectStore(AUDIO);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// value shape: { blob, mimeType, ext }
export const audioCache = {
  put(id, value) {
    return withStore('readwrite', (s) => s.put(value, id));
  },
  get(id) {
    return withStore('readonly', (s) => s.get(id));
  },
  async has(id) {
    try {
      return !!(await audioCache.get(id));
    } catch {
      return false;
    }
  },
  delete(id) {
    return withStore('readwrite', (s) => s.delete(id));
  },
  keys() {
    return withStore('readonly', (s) => s.getAllKeys());
  },
};

export default audioCache;
