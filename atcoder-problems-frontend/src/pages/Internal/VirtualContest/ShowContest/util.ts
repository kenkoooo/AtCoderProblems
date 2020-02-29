import ProblemModel, {
  isProblemModelWithDifficultyModel
} from "../../../../interfaces/ProblemModel";
import { predictSolveProbability } from "../../../../utils/ProblemModelUtil";
import { List, Map as ImmutableMap } from "immutable";
import { ProblemId } from "../../../../interfaces/Status";
import { clipDifficulty, isAccepted } from "../../../../utils";
import Submission from "../../../../interfaces/Submission";
import { VirtualContestItem, VirtualContestMode } from "../../types";

export const formatDuration = (durationSecond: number) => {
  const hours = Math.floor(durationSecond / 3600);
  const minutes = Math.floor(durationSecond / 60) - hours * 60;
  const seconds = durationSecond - hours * 3600 - minutes * 60;

  const mm = minutes < 10 ? "0" + minutes : "" + minutes;
  const ss = seconds < 10 ? "0" + seconds : "" + seconds;
  return `${hours}:${mm}:${ss}`;
};

export const calcPerformance = (
  solvedData: List<{ problemId: string; time: number; solved: boolean }>,
  modelMap: ImmutableMap<ProblemId, ProblemModel>
) => {
  let internalRating = 0;
  let probability = 0.0;
  for (let candidateRating = -4000; candidateRating < 4000; candidateRating++) {
    const p = solvedData
      .map(({ problemId, time, solved }) => {
        const model = modelMap.get(problemId);
        return calcProbability(model, candidateRating, time, solved);
      })
      .reduce((prev, cur) => (cur ? prev * cur : prev), 1.0);
    if (probability < p) {
      probability = p;
      internalRating = candidateRating;
    }
  }

  return clipDifficulty(internalRating);
};

const calcProbability = (
  model: ProblemModel | undefined,
  rating: number,
  time: number,
  solved: boolean
) => {
  const slope = model?.slope;
  const intercept = model?.intercept;
  const v = model?.variance;
  if (isProblemModelWithDifficultyModel(model) && slope && intercept && v) {
    const pSolved = predictSolveProbability(model, rating);
    if (!solved) {
      return 1.0 - pSolved;
    }

    const logTime = Math.log(time);
    const mean = slope * rating + intercept;
    const d = logTime - mean;
    const pTime =
      Math.exp((-d * d) / (2 * v * v)) / Math.sqrt(2 * Math.PI * v * v);
    return pSolved * pTime;
  } else {
    return undefined;
  }
};

export interface BestSubmissionInfo {
  trialsBeforeBest: number;
  bestSubmission: Submission;
}

export interface BestSubmissionEntry {
  userId: string;
  problemId: ProblemId;
  bestSubmissionInfo?: BestSubmissionInfo;
}

const extractBestSubmission = (
  problemSubmissions: Submission[]
): BestSubmissionInfo | undefined => {
  const bestSubmission = problemSubmissions
    .sort((a, b) => a.id - b.id)
    .reduce((currentBest: undefined | Submission, submission) => {
      if (!currentBest) {
        return submission;
      }
      if (currentBest.point < submission.point) {
        return submission;
      }
      if (!isAccepted(currentBest.result) && isAccepted(submission.result)) {
        return submission;
      }
      return currentBest;
    }, undefined);
  if (!bestSubmission) {
    return undefined;
  }
  const trialsBeforeBest = problemSubmissions.filter(
    s => s.id < bestSubmission.id
  ).length;
  return { bestSubmission, trialsBeforeBest };
};

const extractBestSubmissionOfProblemForEachUser = (
  submissions: Submission[],
  users: string[]
): { userId: string; bestSubmissionInfo?: BestSubmissionInfo }[] => {
  const userSubmissionMap = submissions.reduce((map, submission) => {
    const userSubmissions = map.get(submission.user_id);
    if (userSubmissions) {
      userSubmissions.push(submission);
      map.set(submission.user_id, userSubmissions);
    } else {
      map.set(submission.user_id, [submission]);
    }
    return map;
  }, new Map<string, Submission[]>());

  return users.map(userId => {
    const userSubmissions = userSubmissionMap.get(userId);
    if (!userSubmissions) {
      return { userId };
    }

    const bestSubmissionInfo = extractBestSubmission(userSubmissions);
    return { userId, bestSubmissionInfo };
  });
};

export const extractBestSubmissions = (
  submissions: Map<ProblemId, Submission[]>,
  users: string[],
  problems: ProblemId[]
): BestSubmissionEntry[] => {
  return problems.flatMap(problemId => {
    const problemSubmissions = submissions.get(problemId);
    const extractedSubmissions = extractBestSubmissionOfProblemForEachUser(
      problemSubmissions ? problemSubmissions : [],
      users
    );
    return extractedSubmissions.map(entry => ({ problemId, ...entry }));
  });
};

export const calcTotalResult = (
  userId: string,
  problems: VirtualContestItem[],
  mode: VirtualContestMode,
  bestSubmissions: BestSubmissionEntry[]
) => {
  return problems.reduce(
    (state, item) => {
      const problemId = item.id;
      const point = item.point;

      const info = bestSubmissions.find(
        s => s.userId === userId && s.problemId === problemId
      )?.bestSubmissionInfo;
      if (!info || info.bestSubmission.point === 0) {
        return state;
      }

      const best = info.bestSubmission;
      if (point !== null && !isAccepted(best.result)) {
        return state;
      }
      if (mode === "lockout") {
        if (hasBetterSubmission(problemId, userId, best, bestSubmissions)) {
          return state;
        }
      }

      return {
        trialsBeforeBest: state.trialsBeforeBest + info.trialsBeforeBest,
        lastBestSubmissionTime: Math.max(
          state.lastBestSubmissionTime,
          best.epoch_second
        ),
        point: state.point + (point ? point : best.point)
      };
    },
    {
      trialsBeforeBest: 0,
      lastBestSubmissionTime: 0,
      point: 0
    }
  );
};

export const hasBetterSubmission = (
  problemId: string,
  userId: string,
  best: Submission,
  bestSubmissions: BestSubmissionEntry[]
) => {
  const betterSubmission = bestSubmissions
    .filter(s => s.userId !== userId && s.problemId === problemId)
    .map(s => s.bestSubmissionInfo?.bestSubmission)
    .find(s => s && s.id < best.id && isAccepted(s.result));
  return !!betterSubmission;
};

export const getSortedUserIds = (
  users: string[],
  problems: VirtualContestItem[],
  mode: VirtualContestMode,
  bestSubmissions: BestSubmissionEntry[]
) => {
  return users
    .map(userId => {
      const result = calcTotalResult(userId, problems, mode, bestSubmissions);
      return { userId, ...result };
    })
    .sort((a, b) => {
      if (a.point === b.point) {
        if (a.lastBestSubmissionTime === b.lastBestSubmissionTime) {
          return a.trialsBeforeBest - b.trialsBeforeBest;
        }
        return a.lastBestSubmissionTime - b.lastBestSubmissionTime;
      }
      return b.point - a.point;
    })
    .map(e => e.userId);
};
