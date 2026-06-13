export const deleteDb = (dbname: string) => {
  return new Promise((resolve, reject) => {
    const deleteDbReq = indexedDB.deleteDatabase(dbname);
    deleteDbReq.onsuccess = () => resolve();
    deleteDbReq.onerror = reject;
    deleteDbReq.onblocked = reject;
  });
};
