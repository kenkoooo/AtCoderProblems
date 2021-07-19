const VERSION = 3;
export const openDatabase = (
  dbName: string,
  onUpgradeNeeded: (db: IDBDatabase) => Promise<void>
) => {
  return new Promise(
    (resolve: (db: IDBDatabase) => void, reject: (msg: string) => void) => {
      const openDBRequest = window.indexedDB.open(dbName, VERSION);
      openDBRequest.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      openDBRequest.onerror = () => {
        const msg = `Failed to open DB: ${dbName}`;
        console.error(msg);
        reject(msg);
      };
      openDBRequest.onupgradeneeded = async (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        await onUpgradeNeeded(db);
      };
    }
  );
};
export const loadAllData = <T>(db: IDBDatabase, objectStoreName: string) => {
  return new Promise(
    (resolve: (result: T) => void, reject: (msg: string) => void) => {
      const request = db
        .transaction([objectStoreName])
        .objectStore(objectStoreName)
        .getAll();
      request.onsuccess = (e) => {
        const allSubmissions = (e.target as IDBRequest<T>).result;
        resolve(allSubmissions);
      };
      request.onerror = () => {
        const errorMessage = `Failed to load all data from ${objectStoreName}`;
        console.error(errorMessage);
        reject(errorMessage);
      };
    }
  );
};
export const saveData = <T>(
  db: IDBDatabase,
  objectStoreName: string,
  data: T
) => {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction([objectStoreName], "readwrite")
      .objectStore(objectStoreName)
      .put(data);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      console.error(
        `Failed saving ${JSON.stringify(data)} to ${objectStoreName}`
      );
      reject();
    };
  });
};
