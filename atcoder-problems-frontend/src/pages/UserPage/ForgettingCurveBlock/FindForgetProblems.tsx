import moment from "moment";
import Submission from "../../../interfaces/Submission";
import { ProblemId } from "../../../interfaces/Status";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
} from "../../../interfaces/ProblemModel";
import { isAccepted } from "../../../utils";
import { groupBy } from "../../../utils/GroupBy";

interface ProblemSolveInfo {
  problemId: string;
  solveCount: number;
  difficulty: number;
  latestAcceptedDate: moment.Moment;
}

interface ForgetProblems {
  solveCount: number;
  suggestedProblems: ProblemSolveInfo[];
}

interface ForgetConfig {
  solveCount: number;
  forgetDay: number;
}

const forgetConfigs: ForgetConfig[] = [
  { solveCount: 1, forgetDay: 30 },
  { solveCount: 2, forgetDay: 180 },
];

const readDifficultyAsNumber = (
  problemId: string,
  problemModels: Map<ProblemId, ProblemModel>
): number => {
  // very similar to ListPage/ListTable
  const problemModel = problemModels.get(problemId);
  if (problemModel === undefined) {
    return -1;
  }
  if (!isProblemModelWithDifficultyModel(problemModel)) {
    return -1;
  }
  return problemModel.difficulty;
};

const parseProblemSolveInfos = (
  userSubmissions: Submission[],
  problemModels: Map<ProblemId, ProblemModel>
): ProblemSolveInfo[] => {
  const acceptedSubmissions = userSubmissions.filter((submission) =>
    isAccepted(submission.result)
  );
  const acceptedSubmissionsByProblem = groupBy(
    acceptedSubmissions,
    (s) => s.problem_id
  );

  return Array.from(acceptedSubmissionsByProblem).map(
    ([problemId, submissions]) => {
      const solveCount = submissions.length;
      const difficulty = readDifficultyAsNumber(problemId, problemModels);
      const latestAcceptedDate = moment.unix(
        Math.max(...submissions.map((submission) => submission.epoch_second))
      );
      return { problemId, solveCount, difficulty, latestAcceptedDate };
    }
  );
};

const summarizeForgetProblems = (
  problemSolvedInfos: ProblemSolveInfo[]
): ForgetProblems[] => {
  const problemSolvedInfosBySolveCount = groupBy(
    problemSolvedInfos,
    (s) => s.solveCount
  );

  return forgetConfigs
    .map(({ solveCount, forgetDay }) => {
      const forgetDuration = moment.duration(forgetDay, "days");
      const forgetDate = moment().subtract(forgetDuration);
      const solveCountMatchedProblems =
        problemSolvedInfosBySolveCount.get(solveCount) || [];

      const suggestedProblems = solveCountMatchedProblems
        .filter((problem) => problem.latestAcceptedDate <= forgetDate)
        .sort((l, r) => {
          const lval = l.latestAcceptedDate;
          const rval = r.latestAcceptedDate;
          if (lval < rval) return 1;
          if (lval > rval) return -1;
          return 0;
        });

      return { solveCount, suggestedProblems };
    })
    .sort((l, r) => {
      const lval = l.solveCount;
      const rval = r.solveCount;
      if (lval < rval) return -1;
      if (lval > rval) return 1;
      return 0;
    });
};

export const findForgetProblems = (
  userSubmissions: Submission[],
  problemModels: Map<ProblemId, ProblemModel>
): ForgetProblems[] => {
  const problemSolveInfos = parseProblemSolveInfos(
    userSubmissions,
    problemModels
  );
  const forgetProblems = summarizeForgetProblems(problemSolveInfos);
  return forgetProblems;
};
