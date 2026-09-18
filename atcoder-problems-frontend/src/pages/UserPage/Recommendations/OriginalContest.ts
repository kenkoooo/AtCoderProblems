import Problem from "../../../interfaces/Problem";
import { ContestId } from "../../../interfaces/Status";

export const restoreOriginalContest = (
  problem: Problem,
  contestToProblems: Map<ContestId, Problem[]> | undefined
): Problem => {
  if (!problem.contest_id.startsWith("adt_")) {
    return problem;
  }

  const contestId = problem.id.slice(0, problem.id.lastIndexOf("_"));
  const originalProblem = contestToProblems
    ?.get(contestId)
    ?.find((candidate) => candidate.id === problem.id);
  if (!originalProblem) {
    return problem;
  }

  return {
    ...problem,
    contest_id: contestId,
    problem_index: originalProblem.problem_index,
  };
};
