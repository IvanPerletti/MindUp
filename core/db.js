const DB_NAME = 'mindup_db';
const DB_VERSION = 1;
let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'sessionId' });
      }

      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'eventId' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = e => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = () => reject('DB open error');
  });
}

export function getDB() {
  if (!db) throw new Error('DB not initialized');
  return db;
}
