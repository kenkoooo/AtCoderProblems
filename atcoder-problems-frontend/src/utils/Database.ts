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

export const fetchSubmissionFromDatabaseAndServer = async (userId: UserId) => {
  try {
    console.log("Opening database");
    const db = await openSubmissionDatabase(userId);
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
    let fromSecond =
      submissions.length > 0
        ? submissions[submissions.length - 1].epoch_second - 3600
        : 0;
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
  } catch (err) {
    const submissions = [] as Submission[];
    let fromSecond = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const fetched = await fetchPartialUserSubmissions(userId, fromSecond);
      if (fetched.length === 0) {
        break;
      }
      submissions.push(...fetched);
      submissions.sort((a, b) => a.id - b.id);
      fromSecond = submissions[submissions.length - 1].epoch_second + 1;
    }
    return submissions;
  }
};
