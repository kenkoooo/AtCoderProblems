import { isAccepted } from "../../../utils";
import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import { Trophy, TrophySubmission, TrophyGroup } from "./Trophy";

const isCompleteContest = (
  contestId: ContestId,
  contestToProblems: Map<ContestId, Problem[]>,
  solvedProblemIdSet: Set<ProblemId>
): boolean => {
  const problems = contestToProblems.get(contestId);
  return (
    !!problems &&
    problems.every((problem) => solvedProblemIdSet.has(problem.id))
  );
};

const generateCompleteContestTrophy = (
  contestId: ContestId,
  contestTitle: string,
  contestToProblems: Map<ContestId, Problem[]>,
  solvedProblemIdSet: Set<ProblemId>
): Trophy => {
  const title = `Completed ${contestTitle}`;
  const reason = `Solved all problems in ${contestId}`;
  const achieved = isCompleteContest(
    contestId,
    contestToProblems,
    solvedProblemIdSet
  );
  const sortId = `complete-contest-${contestId}`;
  return { title, reason, achieved, sortId, group: "Contests" };
};

const uniqueACProblemIds = (submissions: TrophySubmission[]): Set<string> => {
  const acProblemIds = submissions
    .filter((submissions) => isAccepted(submissions.submission.result))
    .map((submission) => submission.submission.problem_id);
  return new Set(acProblemIds);
};

export const generateCompleteContestTrophies = (
  allSubmissions: TrophySubmission[],
  contests: Map<ContestId, Contest>,
  contestToProblems: Map<ContestId, Problem[]>
): Trophy[] => {
  const trophies = [] as Trophy[];
  const solvedProblemIdSet = uniqueACProblemIds(allSubmissions);

  Array.from(contests).forEach(([contestId, contest]) => {
    trophies.push(
      generateCompleteContestTrophy(
        contestId,
        contest.title,
        contestToProblems,
        solvedProblemIdSet
      )
    );
  });
  return trophies;
};
