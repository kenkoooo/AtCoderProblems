import Submission from "../interfaces/Submission";

const VERSION = 1;
const dbs = new Map();

const deleteDatabase = (user: string, dbName: string, refresh: boolean) => {
  return new Promise<void>((resolve, reject) => {
    if (!refresh) resolve();
    else {
      console.log(`try to delete ${dbName}`);
      const request = window.indexedDB.deleteDatabase(dbName);
      dbs.delete(dbName);
      request.onsuccess = () => {
        console.log("removed successfully");
        resolve();
      };
      request.onerror = () => reject();
    }
  });
};

export const findNextSecond = (user: string, refresh = false) => {
  if (!window.indexedDB || user.length === 0) return 0;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  let nextSecond = -1;
  const dbName = `atcoder-problems-${user}`;
  deleteDatabase(user, dbName, refresh)
    .then(() => {
      if (!dbs.has(user)) {
        const DBOpenRequest = window.indexedDB.open(dbName, VERSION);
        console.log(DBOpenRequest);
        console.log("open!");
        DBOpenRequest.onerror = () => {
          console.log("error");
          throw new Error("IndexDB is unavailable.");
        };
        DBOpenRequest.onupgradeneeded = () => {
          console.log("upgrade needed");
          const db = DBOpenRequest.result;
          console.log(db.version);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const objectStore = db.createObjectStore("submissions", {
            keyPath: "id",
          });
        };
        DBOpenRequest.onsuccess = () => {
          console.log("success");
          const db = DBOpenRequest.result;
          const objectStore = db
            .transaction("submissions")
            .objectStore("submissions");
          const iterateRequest = objectStore.openCursor();
          iterateRequest.onsuccess = () => {
            const cursor = iterateRequest.result;
            if (cursor) {
              nextSecond = Math.max(
                nextSecond,
                parseInt(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  cursor.value.epoch_second
                )
              );
              cursor.continue();
            } else {
              nextSecond += 1;
              console.log(`All done. nextSecond is ${nextSecond}.`);
            }
          };
          console.log("db??");
          console.log(db);
          dbs.set(user, db);
        };
      } else {
        console.log("already exists. content = ", dbs.get(user));
      }
    })
    .catch(() => {
      throw new Error("cannot delete database.");
    });
  return nextSecond;
};

export const mergeNewData = (user: string, newData: Submission[]) => {
  if (!window.indexedDB || user.length === 0) {
    console.log("aaaaa", !window.indexedDB, user.length);
    return newData;
  }
  if (!dbs.has(user)) {
    console.log("why??");
    return newData;
  }

  const allData = newData;
  console.log(dbs);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const db: IDBDatabase = dbs.get(user);
  const objectStore = db
    .transaction("submissions", "readwrite")
    .objectStore("submissions");

  const iterateRequest = objectStore.openCursor();
  let cnt = 0;
  iterateRequest.onsuccess = () => {
    const cursor = iterateRequest.result;
    if (cursor) {
      cnt++;
      allData.push(cursor.value);
      cursor.continue();
    } else {
      console.log("end", cnt, newData.length, allData.length);
      console.log(db);
      newData.forEach((data) => {
        const request = objectStore.add(data);
        request.onsuccess = () => console.log("added.");
        request.onerror = () => {
          // ここを通ってしまう
          console.log("failed.");
        };
      });
    }
  };
  return allData;
};
