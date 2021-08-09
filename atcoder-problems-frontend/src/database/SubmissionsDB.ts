import { UserId } from "../interfaces/Status";
import Submission from "../interfaces/Submission";
import { fetchPartialUserSubmissions } from "../utils/Api";
import { loadAllData, openDatabase, saveData } from "./index";

const OBJECT_STORE = "submissions";
const ALWAYS_FETCH_INTERVAL = 3600 * 24 * 2;

const openSubmissionDatabase = async (userId: UserId) => {
  try {
    return await openDatabase(
      `${userId}-submissions`,
      (db) =>
        new Promise((resolve: () => void) => {
          const submissionStore = db.createObjectStore(OBJECT_STORE, {
            keyPath: "id",
          });
          submissionStore.transaction.oncomplete = () => {
            resolve();
          };
        })
    );
  } catch (e) {
    console.error(e);
    return undefined;
  }
};
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

export const fetchSubmissionsFromDatabaseAndServer = async (userId: UserId) => {
  console.log("Opening database");
  const db = await openSubmissionDatabase(userId);
  if (!db) {
    return fetchNewSubmissions(userId, 0);
  }

  console.log("Loading submissions");
  const submissions = await loadAllData<Submission[]>(db, OBJECT_STORE);

  console.log(`Loaded ${submissions.length} submissions from DB`);
  submissions.sort((a, b) => a.id - b.id);

  const lastSecond =
    submissions.length > 0
      ? submissions[submissions.length - 1].epoch_second
      : undefined;
  const fromSecond = lastSecond ? lastSecond - ALWAYS_FETCH_INTERVAL : 0;

  const newSubmissions = await fetchNewSubmissions(userId, fromSecond);
  console.log(`Saving ${newSubmissions.length} new submissions`);
  for (const submission of newSubmissions) {
    await saveData(db, OBJECT_STORE, submission);
  }

  submissions.push(...newSubmissions);

  // deduplicate submissions
  const submissionById = new Map<number, Submission>();
  submissions.forEach((submission) => {
    submissionById.set(submission.id, submission);
  });
  return Array.from(submissionById).map(([, submission]) => submission);
};
