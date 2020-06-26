import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import { Trophy } from "./Trophy";

const isCompleteContest = (
  contest_id: ContestId,
  contestToProblems: Map<ContestId, Problem[]>,
  solvedProblemIdSet: Set<ProblemId>
): boolean => {
  const problems = contestToProblems.get(contest_id);
  return (
    !!problems &&
    problems.every((problem) => solvedProblemIdSet.has(problem.id))
  );
};

const generateCompleteContestTrophy = (
  contest_id: ContestId,
  contest_title: string,
  contestToProblems: Map<ContestId, Problem[]>,
  solvedProblemIdSet: Set<ProblemId>
): Trophy => {
  const title = `Completed ${contest_title}`;
  const reason = `Solved all problems in ${contest_id}`;
  const achieved = isCompleteContest(
    contest_id,
    contestToProblems,
    solvedProblemIdSet
  );
  const sortId = `complete-contest-${contest_id}`;
  return { title, reason, achieved, sortId };
};

export const generateCompleteContestTrophies = (
  contests: Map<ContestId, Contest>,
  contestToProblems: Map<ContestId, Problem[]>,
  solvedProblemIds: ProblemId[]
): Trophy[] => {
  const trophies = [] as Trophy[];
  const solvedProblemIdSet = new Set(solvedProblemIds);

  Array.from(contests).forEach(([contest_id, contest]) => {
    trophies.push(
      generateCompleteContestTrophy(
        contest_id,
        contest.title,
        contestToProblems,
        solvedProblemIdSet
      )
    );
  });
  return trophies;
};
