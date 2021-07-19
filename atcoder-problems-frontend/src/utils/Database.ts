import { UserId } from "../interfaces/Status";
import Submission from "../interfaces/Submission";
import { fetchPartialUserSubmissions } from "./Api";

const VERSION = 3;

const openDatabase = (
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
        const msg = `Failed opening DB: ${dbName}`;
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

const openSubmissionDatabase = (userId: UserId) =>
  openDatabase(`${userId}-submissions`, (db) => {
    return new Promise((resolve: () => void) => {
      const submissionStore = db.createObjectStore("submissions", {
        keyPath: "id",
      });
      submissionStore.transaction.oncomplete = () => {
        resolve();
      };
    });
  });

const fetchNewSubmissions = async (
  userId: UserId,
  fromSecond: number
): Promise<Submission[]> => {
  const newSubmissions = [] as Submission[];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const fetched = await fetchPartialUserSubmissions(userId, fromSecond);
    if (fetched.length === 0) {
      break;
    }
    newSubmissions.push(...fetched);
    newSubmissions.sort((a, b) => a.id - b.id);
    fromSecond = newSubmissions[newSubmissions.length - 1].epoch_second + 1;
  }
  return newSubmissions;
};

export const fetchSubmissions = async (userId: UserId) => {
  console.log("Opening database");
  let db: IDBDatabase;
  try {
    db = await openSubmissionDatabase(userId);
  } catch (err) {
    // db が取得できないため、全部を取得
    return await fetchNewSubmissions(userId, 0);
  }

  console.log("Loading submissions");
  const submissions = await new Promise(
    (
      resolve: (result: Submission[]) => void,
      reject: (msg: string) => void
    ) => {
      const request = db
        .transaction(["submissions"])
        .objectStore("submissions")
        .getAll();
      request.onsuccess = (e) => {
        const allSubmissions = (e.target as IDBRequest<Submission[]>).result;
        resolve(allSubmissions);
      };
      request.onerror = () => {
        console.error("Failed getAll submissions");
        reject("Failed getAll submissions");
      };
    }
  );

  console.log(`Loaded ${submissions.length} submissions from DB`);
  submissions.sort((a, b) => a.id - b.id);
  const fromSecond =
    submissions.length > 0
      ? submissions[submissions.length - 1].epoch_second - 3600
      : 0;
  const newSubmissions = await fetchNewSubmissions(userId, fromSecond);
  console.log(`Saving ${newSubmissions.length} new submissions`);
  for (const submission of newSubmissions) {
    await new Promise((resolve, reject) => {
      const request = db
        .transaction(["submissions"], "readwrite")
        .objectStore("submissions")
        .put(submission);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error(`Failed saving submission: ${submission.id}`);
        reject();
      };
    });
  }

  submissions.push(...newSubmissions);
  const submissionById = new Map<number, Submission>();
  submissions.forEach((submission) => {
    submissionById.set(submission.id, submission);
  });

  return Array.from(submissionById).map(([, submission]) => submission);
};
